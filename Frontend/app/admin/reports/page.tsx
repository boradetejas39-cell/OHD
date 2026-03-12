'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI, reportAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
interface Company {
  _id: string;
  name: string;
}

interface OverallReport {
  overallPercentage: number;
  totalResponses: number;
  totalCompanies: number;
  bestSection?: {
    sectionName: string;
    percentage: number;
  } | null;
  summaryInsights?: string[];
  ratingDistributionPercentage?: { A: number; B: number; C: number; D: number; E: number };
  ratingDistribution?: { A: number; B: number; C: number; D: number; E: number };
}

interface QuestionStat {
  questionId: string;
  questionText: string;
  ratingCount: { A: number; B: number; C: number; D: number; E: number };
  ratingPercentage: { A: number; B: number; C: number; D: number; E: number };
  totalResponses: number;
}

interface SectionStat {
  sectionId: string;
  sectionName: string;
  questionStats: QuestionStat[];
  sectionPercentage: number;
  totalResponses: number;
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

// const getTopAnswer = (ratingCount: { A: number; B: number; C: number; D: number; E: number }) => {
//   let top = 'none';
//   let max = -1;
//   Object.entries(ratingCount).forEach(([key, value]) => {
//     if (value > max) {
//       max = value;
//       top = key;
//     }
//   });
//   if (max === 0) return { label: 'No Responses', count: 0 };
//   return { label: RATING_LABELS[top], count: max };
// };

export default function ReportsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [overall, setOverall] = useState<OverallReport | null>(null);
  const [sections, setSections] = useState<SectionStat[]>([]);
  const [selectedPillar, setSelectedPillar] = useState<string>('1');

  const fetchCompanies = async () => {
    try {
      const res = await companyAPI.getAll();
      setCompanies(res.data.companies || []);
    } catch (error: unknown) {
      console.error('Failed to load companies', error);
      const message = error instanceof Error ? error.message : 'Failed to load companies';
      toast.error(message);
    }
  };

  const fetchOverall = async (companyId?: string) => {
    try {
      const res = await reportAPI.getOverallReport(companyId || undefined);
      setOverall(res.data.overallStats || null);
      setSections(res.data.sectionStats || []);
    } catch (error: unknown) {
      console.error('Failed to load report', error);
      const message = error instanceof Error ? error.message : 'Failed to load report';
      toast.error(message);
      setOverall(null);
      setSections([]);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchOverall();
  }, []);

  const handleCompanyChange = (id: string) => {
    setSelectedCompany(id);
    fetchOverall(id || undefined);
  };

  const pieData = useMemo(() => {
    if (!overall?.ratingDistribution) return [];
    return [
      { name: 'Strongly Agree', value: overall.ratingDistribution.A },
      { name: 'Agree', value: overall.ratingDistribution.B },
      { name: 'Neutral', value: overall.ratingDistribution.C },
      { name: 'Disagree', value: overall.ratingDistribution.D },
      { name: 'Strongly Disagree', value: overall.ratingDistribution.E }
    ].filter(d => d.value > 0);
  }, [overall]);

  const sectionBarData = useMemo(() => {
    return sections.map(s => ({
      name: s.sectionName.length > 20 ? s.sectionName.substring(0, 20) + '...' : s.sectionName,
      Percentage: Number(s.sectionPercentage.toFixed(1))
    }));
  }, [sections]);

  const pillarChartData = useMemo(() => {
    if (!sections || sections.length === 0) return [];

    // Filter sections by selectedPillar
    const pillarPrefix = `Pillar ${selectedPillar}_`;
    const pillarSections = sections.filter(s => s.sectionName.startsWith(pillarPrefix));

    const data = pillarSections.map(s => {
      const match = s.sectionName.match(/^Pillar (\d+)_(\d+)/);
      const label = match ? `P${match[1]}.${match[2]}` : s.sectionName.split(' ')[0];

      let a = 0, b = 0, c = 0, d = 0, e = 0;
      s.questionStats.forEach(q => {
        a += q.ratingCount?.A || 0;
        b += q.ratingCount?.B || 0;
        c += q.ratingCount?.C || 0;
        d += q.ratingCount?.D || 0;
        e += q.ratingCount?.E || 0;
      });

      return {
        name: label,
        SA: a,
        A: b,
        N: c,
        D: d,
        SD: e
      };
    });

    if (data.length > 0) {
      const finalScore = {
        name: 'FINAL SCORE',
        SA: data.reduce((acc, curr) => acc + curr.SA, 0),
        A: data.reduce((acc, curr) => acc + curr.A, 0),
        N: data.reduce((acc, curr) => acc + curr.N, 0),
        D: data.reduce((acc, curr) => acc + curr.D, 0),
        SD: data.reduce((acc, curr) => acc + curr.SD, 0),
      };
      data.push(finalScore);
    }

    return data;
  }, [sections, selectedPillar]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500">Global and company-specific diagnostic insights.</p>
          </div>
          <select
            value={selectedCompany}
            onChange={(e) => handleCompanyChange(e.target.value)}
            className="w-full md:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">All Companies (Global)</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Overall Health Score</p>
            <h3 className="text-3xl font-bold text-gray-900">
              {overall && typeof overall.overallPercentage === 'number'
                ? `${overall.overallPercentage.toFixed(1)}%`
                : 'N/A'}
            </h3>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${overall?.overallPercentage || 0}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Responses</p>
            <h3 className="text-3xl font-bold text-gray-900">
              {overall?.totalResponses?.toLocaleString() || '0'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Across all surveys</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Companies</p>
            <h3 className="text-3xl font-bold text-gray-900">
              {overall?.totalCompanies || '0'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Diagnostic entities</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900">Pillar Distribution</h2>
            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPillar(p.toString())}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    selectedPillar === p.toString() ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  P{p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 w-full">
            {pillarChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pillarChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  <Bar dataKey="SA" name="Strongly Agree" fill="#10b981" />
                  <Bar dataKey="A" name="Agree" fill="#14b8a6" />
                  <Bar dataKey="N" name="Neutral" fill="#94a3b8" />
                  <Bar dataKey="D" name="Disagree" fill="#f59e0b" />
                  <Bar dataKey="SD" name="Strongly Disagree" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">No data available for this pillar.</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-md font-bold text-gray-900 mb-6">Section Performance</h3>
              <div className="h-64 w-full">
                {sectionBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectionBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal stroke="#eee" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="Percentage" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">No section data.</div>
                )}
              </div>
           </div>

           <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-md font-bold text-gray-900 mb-6">Response Sentiment</h3>
              <div className="h-64 w-full relative">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">No sentiment data.</div>
                )}
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}
