'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { UploadCloud, Building2, Mail, Briefcase, Users, ArrowLeft } from 'lucide-react';

export default function AddCompanyPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [industry, setIndustry] = useState('');
    const [employeeCount, setEmployeeCount] = useState<number | ''>('');
    const [creating, setCreating] = useState(false);

    // File upload state
    const [fileName, setFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            toast.error('Name and email are required');
            return;
        }

        try {
            setCreating(true);
            await companyAPI.create({
                name,
                email,
                industry: industry || undefined,
                employeeCount: employeeCount || undefined,
            });
            toast.success('Company created');
            router.push('/admin/companies');
        } catch (error: any) {
            console.error('Failed to create company', error);
            toast.error(error.response?.data?.error || 'Failed to create company');
        } finally {
            setCreating(false);
        }
    };

    return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Company</h1>
          <p className="text-sm text-gray-500">Create a new organizational profile in the system.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter company name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="admin@company.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Industry</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Technology"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Employee Count</label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Number of employees"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-sm font-semibold text-gray-700">Supporting Documents</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${fileName ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" />
                <div className="flex flex-col items-center">
                  <UploadCloud className={`w-8 h-8 mb-2 ${fileName ? 'text-primary-600' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-gray-700">{fileName ? fileName : 'Click to upload files'}</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX up to 10MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/admin/companies"
              className="px-6 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
    );
}
