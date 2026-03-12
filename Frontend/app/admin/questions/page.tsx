'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { questionAPI, sectionAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface Section {
  _id: string;
  name: string;
}

interface Question {
  _id: string;
  text: string;
  order: number;
  sectionId: Section | string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const [sectionId, setSectionId] = useState('');
  const [text, setText] = useState('');
  const [order, setOrder] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await questionAPI.getAll();
      setQuestions(res.data.questions || []);
    } catch (error: unknown) {
      console.error('Failed to load questions', error);
      const message = error instanceof Error ? error.message : 'Failed to load questions';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await sectionAPI.getAll();
      setSections(res.data.sections || []);
    } catch (error: unknown) {
      console.error('Failed to load sections', error);
      const message = error instanceof Error ? error.message : 'Failed to load sections';
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchQuestions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionId || !text || order === '') {
      toast.error('Section, text and order are required');
      return;
    }

    try {
      setCreating(true);
      const res = await questionAPI.create({
        sectionId,
        text,
        order,
      });
      toast.success('Question created');
      setSectionId('');
      setText('');
      setOrder('');
      setQuestions((prev) => [...prev, res.data.question]);
    } catch (error: unknown) {
      console.error('Failed to create question', error);
      const message = error instanceof Error ? error.message : 'Failed to create question';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const getSectionName = (q: Question) => {
    if (typeof q.sectionId === 'string') {
      const section = sections.find((s) => s._id === q.sectionId);
      return section?.name || '-';
    }
    return q.sectionId?.name || '-';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
            <p className="text-sm text-gray-500">Manage questions for each diagnostic section.</p>
          </div>
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
             <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Questions: </span>
             <span className="text-sm font-bold text-primary-600">{questions.length}</span>
          </div>
        </div>

        {/* Create question form */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Question</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Section</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select section...</option>
                  {sections.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Question Text</label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter question text"
                  required
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

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Add Question'}
              </button>
            </div>
          </form>
        </div>

        {/* Questions list */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {questions.length === 0 && !loading ? (
             <div className="p-12 text-center text-gray-500">No questions found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {questions.map((q) => (
                <div
                  key={q._id}
                  className="p-5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase tracking-wider">
                            {getSectionName(q)}
                         </span>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order: {q.order}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{q.text}</p>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                       </button>
                       <button className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


