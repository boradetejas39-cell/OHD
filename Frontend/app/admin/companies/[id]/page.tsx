'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI } from '@/lib/apiClient';
import Link from 'next/link';
import { ArrowLeft, Mail, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Company {
  _id: string;
  name: string;
  email: string;
  industry?: string;
  employeeCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await companyAPI.getById(companyId);
      setCompany(res.data.company || res.data);
    } catch (error: unknown) {
      console.error('Failed to load company', error);
      const message = error instanceof Error ? error.message : 'Failed to load company';
      toast.error(message);
      router.push('/admin/companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchCompany();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleDelete = async () => {
    if (!companyId) return;
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      setDeleting(true);
      await companyAPI.delete(companyId);
      toast.success('Company deleted successfully');
      router.push('/admin/companies');
    } catch (error: unknown) {
      console.error('Failed to delete company', error);
      const message = error instanceof Error ? error.message : 'Failed to delete company';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/companies')}
              className="group flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:text-primary-600 font-bold text-xs uppercase tracking-widest transition-all shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Registry
            </button>
          </div>
          
          {company && (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/admin/mail?companyId=${company._id}`}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all hover:translate-y-[-2px]"
              >
                <Mail className="w-4 h-4" />
                Dispatch Survey
              </Link>
              <Link
                href={`/admin/companies/${company._id}/edit`}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all hover:translate-y-[-1px]"
              >
                <Edit className="w-4 h-4" />
                Modify
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Purging...' : 'Purge'}
              </button>
            </div>
          )}
        </div>

        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${company?.status !== 'inactive' ? 'bg-emerald-500' : 'bg-slate-300'} animate-pulse`} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Entity Profile</p>
           </div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
             {company ? company.name : 'System Access Restricted'}
           </h1>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-100 p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-bl-full -z-10 opacity-50" />
          
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-primary-500">
               <svg className="animate-spin h-10 w-10 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Retrieving Intelligence...</span>
            </div>
          ) : !company ? (
            <div className="py-20 text-center space-y-4">
               <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                  <Trash2 className="w-10 h-10" />
               </div>
               <p className="text-xl font-bold text-slate-900">Entity Not Located</p>
               <p className="text-slate-400 text-sm font-medium">The requested organization ID does not exist in the OHD global database.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Legal Identifier</p>
                <p className="text-xl font-bold text-slate-900">{company.name}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Primary Communications</p>
                <div className="flex items-center gap-2 group cursor-pointer">
                   <Mail className="w-4 h-4 text-primary-500" />
                   <p className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors underline decoration-slate-100 decoration-4 underline-offset-4">{company.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Market Sector</p>
                <p className="text-lg font-bold text-slate-900">{company.industry || 'General Commerce'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Human Capital Volume</p>
                <p className="text-lg font-bold text-slate-900">
                  {typeof company.employeeCount === 'number'
                    ? company.employeeCount.toLocaleString()
                    : company.employeeCount ?? 'No Data'}
                  <span className="text-xs text-slate-400 ml-2 font-medium tracking-tight whitespace-nowrap">Provisioned Seats</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Diagnostic Integrity</p>
                <div className="flex items-center gap-3">
                   <span className={`inline-flex items-center rounded-2xl px-5 py-2 text-[10px] font-black uppercase tracking-widest ${
                     company.status !== 'inactive' 
                     ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                     : 'bg-slate-50 text-slate-400 border border-slate-100'
                   }`}>
                    {company.status || 'Active'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Real-time Telemetry Enabled</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Persistence Log</p>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-600">
                    <span className="text-slate-400 font-medium mr-2">Registered:</span>
                    {company.createdAt ? new Date(company.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Unknown Origin'}
                  </p>
                  {company.updatedAt && (
                     <p className="text-sm font-bold text-slate-600">
                        <span className="text-slate-400 font-medium mr-2">Last Sync:</span>
                        {new Date(company.updatedAt).toLocaleTimeString()}
                     </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary insights or stats could go here */}
        <div className="px-8 flex items-center justify-between text-slate-400">
          <p className="text-[10px] font-black uppercase tracking-widest">Internal System Reference: {companyId}</p>
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white" />)}
             </div>
             <p className="text-[10px] font-bold uppercase tracking-tight">Accessing Diagnostic Data...</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


