'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { sectionAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface Section {
  _id: string;
  name: string;
  description?: string;
  pillar: number;
  order: number;
}

const PILLAR_NAMES: Record<number, string> = {
  1: 'PILLAR 1 (P1) – LEADERSHIP & STRATEGIC DIRECTION',
  2: 'PILLAR 2 – MANAGEMENT & PEOPLE SYSTEMS',
  3: 'PILLAR 3 – CULTURE & ENGAGEMENT',
  4: 'PILLAR 4 – SYSTEMS & EXECUTION',
  5: 'PILLAR 5 – GROWTH & SUSTAINABILITY',
};

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  // const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pillar, setPillar] = useState<number | ''>('');
  const [order, setOrder] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);

  const fetchSections = async () => {
    try {
      // setLoading(true);
      const res = await sectionAPI.getAll();
      setSections(res.data.sections || []);
    } catch (error: unknown) {
      console.error('Failed to load sections', error);
      const message = error instanceof Error ? error.message : 'Failed to load sections';
      toast.error(message);
    // } finally {
    //   setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || pillar === '' || order === '') {
      toast.error('Name, pillar, and order are required');
      return;
    }

    try {
      setCreating(true);
      const res = await sectionAPI.create({
        name,
        description: description || undefined,
        pillar,
        order,
      });
      toast.success('Section created');
      setName('');
      setDescription('');
      setPillar('');
      setOrder('');
      setSections((prev) => [...prev, res.data.section]);
    } catch (error: unknown) {
      console.error('Failed to create section', error);
      const message = error instanceof Error ? error.message : 'Failed to create section';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  // Group sections by pillar
  const sectionsByPillar = sections.reduce((acc, section) => {
    if (!acc[section.pillar]) {
      acc[section.pillar] = [];
    }
    acc[section.pillar].push(section);
    return acc;
  }, {} as Record<number, Section[]>);

  // Sort sections within each pillar by order
  Object.keys(sectionsByPillar).forEach((pillarNum) => {
    sectionsByPillar[Number(pillarNum)].sort((a, b) => a.order - b.order);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sections</h1>
          <p className="text-sm text-gray-500">Manage diagnostic pillars and their sections.</p>
        </div>

        {/* Create section form */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Section</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Target Pillar</label>
                <select
                  value={pillar}
                  onChange={(e) => setPillar(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Pillar...</option>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p}>P{p} - {PILLAR_NAMES[p].split('–')[1]?.trim() || PILLAR_NAMES[p]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Leadership"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional description"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Order</label>
                <input
                  type="number"
                  min={1}
                  value={order}
                  onChange={(e) => setOrder(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="1"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Add Section'}
              </button>
            </div>
          </form>
        </div>

        {/* Sections list */}
        <div className="space-y-8">
          {[1, 2, 3, 4, 5].map((pillarNum) => {
            const pillarSections = sectionsByPillar[pillarNum] || [];
            if (pillarSections.length === 0) return null;

            return (
              <div key={pillarNum} className="space-y-4">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    Pillar {pillarNum}: {PILLAR_NAMES[pillarNum].split('–')[1]?.trim() || PILLAR_NAMES[pillarNum]}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pillarSections.map((s) => (
                    <div
                      key={s._id}
                      className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order: {s.order}</span>
                        <div className="flex gap-1">
                           {/* Action buttons could go here */}
                        </div>
                      </div>
                      <h4 className="text-md font-bold text-gray-900 mb-1">{s.name}</h4>
                      {s.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{s.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}


