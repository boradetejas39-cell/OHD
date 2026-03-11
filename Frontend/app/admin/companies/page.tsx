'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Mail, Edit, Eye, Trash2, Plus } from 'lucide-react';

interface Company {
  _id: string;
  name: string;
  email: string;
  industry?: string;
  employeeCount?: number;
  status?: string;
  createdAt?: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await companyAPI.getAll();
      setCompanies(res.data.companies || []);
    } catch (error: any) {
      console.error('Failed to load companies', error);
      toast.error(error.response?.data?.error || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      await companyAPI.delete(id);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
      toast.success('Company deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete company');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="text-sm text-gray-500">Manage all registered companies in the system.</p>
          </div>
          <Link
            href="/admin/companies/add"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading && companies.length === 0 ? (
               <div className="p-12 text-center text-gray-500">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No companies found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{c.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{c.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600 font-medium">{c.industry || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {c.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/admin/mail?companyId=${c._id}`} className="p-1.5 text-gray-400 hover:text-primary-600" title="Send Mail">
                            <Mail className="w-4 h-4" />
                          </Link>
                          <Link href={`/admin/companies/${c._id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <Link href={`/admin/companies/${c._id}`} className="p-1.5 text-gray-400 hover:text-emerald-600" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


