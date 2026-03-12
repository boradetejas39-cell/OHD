'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI, mailAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface MailLog {
  _id: string;
  subject: string;
  status: string;
  totalRecipients?: number;
  successCount?: number;
  failureCount?: number;
  createdAt?: string;
}

interface Company {
  _id: string;
  name: string;
}

export default function MailPageContent() {
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [surveyLinkPreview, setSurveyLinkPreview] = useState('');
  const [selectedService, setSelectedService] = useState('Organizational Health Diagnostic');

  const services = [
    'Organizational Health Diagnostic',
    'Culture Audit',
    'Leadership Assessment',
    'Employee Engagement Survey',
    'Team Performance Evaluation',
    'Other'
  ];

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await mailAPI.getLogs();
      setLogs(res.data.logs || []);
    } catch (error: unknown) {
      console.error('Failed to load mail logs', error);
      const message = error instanceof Error ? error.message : 'Failed to load mail logs';
      toast.error(message);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const companyRes = await companyAPI.getAll();
        setCompanies(companyRes.data.companies || []);
        const companyIdFromQuery = searchParams.get('companyId');
        if (companyIdFromQuery) {
          setSelectedCompany(companyIdFromQuery);
        }
      } catch (error: unknown) {
        console.error('Failed to load companies', error);
        const message = error instanceof Error ? error.message : 'Failed to load companies';
        toast.error(message);
      }
      fetchLogs();
    };
    init();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedCompany) {
      setSurveyLinkPreview('');
      return;
    }
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SURVEY_URL_BASE || '';
    if (!origin) {
      setSurveyLinkPreview('');
      return;
    }
    setSurveyLinkPreview(`${origin}/survey?companyId=${selectedCompany}`);
  }, [selectedCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subject || !selectedCompany) {
      toast.error('File, subject and company are required');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    formData.append('companyId', selectedCompany);
    formData.append('service', selectedService);
    if (surveyLinkPreview) {
      formData.append('surveyLink', surveyLinkPreview);
    }
    const company = companies.find((c) => c._id === selectedCompany);
    if (company) {
      formData.append('companyName', company.name);
    }

    try {
      setSending(true);
      await mailAPI.sendBulk(formData);
      toast.success('Bulk mail sent (processing in background)');
      setSubject('');
      setMessage('');
      setFile(null);
      setSelectedCompany('');
      setSurveyLinkPreview('');
      fetchLogs();
    } catch (error: unknown) {
      console.error('Failed to send bulk mail', error);
      const message = error instanceof Error ? error.message : 'Failed to send bulk mail';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mail Sender</h1>
            <p className="text-sm text-gray-500">Send bulk emails and track transmission logs.</p>
          </div>
          <button 
            onClick={fetchLogs}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className={`w-4 h-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh Logs
          </button>
        </div>

        {/* Send Mail Form */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Send Bulk Mail</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select organization...</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {services.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Recipients (.csv, .xlsx)</label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Administrative Note</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Internal notes about this mailing"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs text-gray-500 italic">
                {surveyLinkPreview && (
                  <span className="break-all">Link: {surveyLinkPreview}</span>
                )}
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Bulk Mail'}
              </button>
            </div>
          </form>
        </div>

        {/* Mail Logs */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-md font-bold text-gray-900">Mail Logs</h2>
          </div>
          
          {logs.length === 0 && !loadingLogs ? (
            <div className="p-12 text-center text-gray-500">No logs found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{log.subject}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      log.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      log.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-3">{log.createdAt && new Date(log.createdAt).toLocaleString()}</p>
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-3">
                     <div>
                        <p className="text-[10px] text-gray-400 uppercase">Total</p>
                        <p className="text-md font-bold text-gray-900">{log.totalRecipients ?? 0}</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-gray-400 uppercase">Success</p>
                        <p className="text-md font-bold text-green-600">{log.successCount ?? 0}</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-gray-400 uppercase">Failed</p>
                        <p className="text-md font-bold text-red-600">{log.failureCount ?? 0}</p>
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
