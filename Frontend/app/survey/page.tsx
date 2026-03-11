'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { companyAPI, questionAPI, responseAPI, sectionAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';

type NumericRating = 1 | 2 | 3 | 4 | 5;

interface Section {
  _id: string;
  name: string;
  pillar: number;
  order: number;
}

interface Question {
  _id: string;
  text: string;
  sectionId: string | Section;
  order: number;
}

interface Company {
  _id: string;
  name: string;
}

const TOTAL_TIME_SECONDS = 30 * 60; // 30 minutes

const numericToLetterRating = (value: NumericRating): 'A' | 'B' | 'C' | 'D' | 'E' => {
  // Keep internal scoring consistent where A is highest (5) and E is lowest (1)
  const map: Record<NumericRating, 'A' | 'B' | 'C' | 'D' | 'E'> = {
    5: 'A',
    4: 'B',
    3: 'C',
    2: 'D',
    1: 'E',
  };
  return map[value];
};

export default function SurveyPage() {
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get('companyId') || '';

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [department, setDepartment] = useState('');

  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);
  const [expired, setExpired] = useState(false);

  const [answers, setAnswers] = useState<Record<string, NumericRating | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch sections, questions and company meta
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoadingMeta(true);
        const [sectionRes, questionRes] = await Promise.all([
          sectionAPI.getAll(),
          questionAPI.getAll(),
        ]);

        setSections(sectionRes.data.sections || []);
        setQuestions(questionRes.data.questions || []);

        if (initialCompanyId) {
          const companyRes = await companyAPI.getById(initialCompanyId);
          setCompany(companyRes.data.company || companyRes.data);
        }
      } catch (error: any) {
        console.error('Failed to load survey data', error);
        toast.error(error.response?.data?.error || 'Failed to load survey data');
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMeta();
  }, [initialCompanyId]);

  // Timer logic
  useEffect(() => {
    if (!started || expired) return;

    if (timeLeft <= 0) {
      setExpired(true);
      toast.error('Time is up. The 30-minute window has ended.');
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [started, expired, timeLeft]);

  // Convert question order (1-5) to letter (A-E)
  const orderToLetter = (order: number): string => {
    return String.fromCharCode(64 + order); // 65 is 'A', so 64 + 1 = 'A'
  };

  const groupedByPillar = useMemo(() => {
    // Pillar name mapping (should match initDatabase.ts)
    const pillarNames: Record<number, string> = {
      1: 'LEADERSHIP & STRATEGIC DIRECTION',
      2: 'MANAGEMENT & PEOPLE SYSTEMS',
      3: 'CULTURE & ENGAGEMENT',
      4: 'SYSTEMS & EXECUTION',
      5: 'GROWTH & SUSTAINABILITY',
    };

    // Group sections by pillar
    const pillarMap = new Map<number, { pillar: number; pillarName: string; subsections: Array<{ section: Section; questions: Question[] }> }>();
    
    // Sort sections by pillar and order
    const sortedSections = sections
      .slice()
      .sort((a, b) => {
        if (a.pillar !== b.pillar) return a.pillar - b.pillar;
        return a.order - b.order;
      });

    // Group sections by pillar
    sortedSections.forEach((section) => {
      if (!pillarMap.has(section.pillar)) {
        pillarMap.set(section.pillar, {
          pillar: section.pillar,
          pillarName: pillarNames[section.pillar] || `Pillar ${section.pillar}`,
          subsections: [],
        });
      }

      const pillarData = pillarMap.get(section.pillar)!;
      const sectionQuestions = questions
        .filter((q) => {
          const sid = typeof q.sectionId === 'string' ? q.sectionId : q.sectionId._id;
          return sid === section._id;
        })
        .sort((a, b) => a.order - b.order);

      pillarData.subsections.push({
        section,
        questions: sectionQuestions,
      });
    });

    // Convert map to array and sort by pillar number
    return Array.from(pillarMap.values()).sort((a, b) => a.pillar - b.pillar);
  }, [sections, questions]);

  const totalQuestions = questions.length;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialCompanyId) {
      toast.error('Invalid or missing company link. Please contact your administrator.');
      return;
    }
    if (!department.trim()) {
      toast.error('Please enter your department to begin.');
      return;
    }
    setStarted(true);
  };

  const setAnswer = (questionId: string, value: NumericRating) => {
    if (!started || expired) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!started) {
      toast.error('Please start the assessment first.');
      return;
    }
    if (expired) {
      toast.error('Time is up. You cannot submit after 30 minutes.');
      return;
    }
    if (!initialCompanyId) {
      toast.error('Invalid company link.');
      return;
    }

    // Ensure all questions are answered
    const answeredCount = Object.values(answers).filter(Boolean).length;
    if (totalQuestions === 0) {
      toast.error('No questions configured. Please contact your administrator.');
      return;
    }
    if (answeredCount !== totalQuestions) {
      toast.error(`Please answer all questions before submitting.`);
      return;
    }

    const payloadAnswers = questions.map((q) => {
      const value = answers[q._id] as NumericRating;
      return {
        questionId: q._id,
        rating: numericToLetterRating(value),
      };
    });

    try {
      setSubmitting(true);
      await responseAPI.submit({
        companyId: initialCompanyId,
        employeeName: department.trim(),
        answers: payloadAnswers,
      });
      toast.success('Thank you! Your responses have been submitted.');
      setSubmitting(false);
      setStarted(false);
      setExpired(false);
      setTimeLeft(TOTAL_TIME_SECONDS);
      setAnswers({});
    } catch (error: any) {
      console.error('Failed to submit response', error);
      toast.error(error.response?.data?.error || 'Failed to submit response');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-primary-500 selection:text-white">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-indigo-500 to-primary-400 z-50" />
      <div className="absolute top-0 right-0 w-[50%] h-[500px] bg-primary-50/50 rounded-full blur-[120px] -z-10" />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header with logo and title */}
        <header className="flex flex-col items-center text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-white p-4 rounded-[2rem] shadow-xl shadow-slate-200/50 mb-8 transform transition-transform hover:scale-105">
            <div className="relative w-32 h-14">
              <Image src="/ohdlogo.png" alt="OHD Logo" fill className="object-contain" priority />
            </div>
          </div>
          <div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold uppercase tracking-widest mb-4 border border-primary-200">
              Diagnostic Assessment
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Organizational Health <span className="text-primary-600">Diagnostic</span>
            </h1>
            <p className="mt-4 text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
              Standardized evaluation framework across 5 strategic pillars to measure organizational maturity and cultural alignment.
            </p>
            {company && (
              <div className="mt-8 inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-sm text-slate-400 font-medium tracking-wide">ASSESSING FOR</span>
                <span className="text-sm font-bold text-slate-900">{company.name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Instructions & participant info */}
        {!started ? (
          <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-10 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              <div className="lg:col-span-3">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mr-3 text-sm">i</span>
                  Important Guidelines
                </h2>
                <ul className="space-y-4">
                  {[
                    "Your responses are 100% confidential and anonymized.",
                    "Respond instinctively — your first thought is usually the most accurate.",
                    "Base answers on your current experience, not expectations.",
                    "The assessment will take approximately 12-15 minutes.",
                    "A 30-minute timer will start once you click below."
                  ].map((text, i) => (
                    <li key={i} className="flex items-start text-slate-600 font-medium">
                      <svg className="w-5 h-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Start Assessment</h3>
                  <form onSubmit={handleStart} className="space-y-6">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                        Select Department
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                      >
                        <option value="">Choose Department...</option>
                        {["Finance", "Sales", "HR", "Marketing", "Operations", "IT", "Engineering", "Customer Service", "Legal", "Procurement", "Quality Assurance", "R&D", "Administration", "Other"].map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={loadingMeta || !initialCompanyId}
                      className="w-full bg-primary-600 text-white rounded-2xl py-4 font-bold shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loadingMeta ? 'Preparing System...' : 'Begin Now'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Active Assessment Stage */
          <div className="relative animate-in slide-in-from-bottom-8 duration-500">
            {/* Sticky Progress Bar */}
            <div className="sticky top-6 z-40 mb-12">
               <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-6 flex items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
                       <span className="text-xs font-black text-slate-900">
                          {Math.round((Object.values(answers).filter(Boolean).length / totalQuestions) * 100)}%
                       </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-primary-600 transition-all duration-500 rounded-full"
                        style={{ width: `${(Object.values(answers).filter(Boolean).length / totalQuestions) * 100}%` }}
                       />
                    </div>
                  </div>
                  <div className={`px-6 py-2 rounded-2xl text-center border-2 transition-colors ${timeLeft < 300 ? 'border-rose-200 bg-rose-50 text-rose-600 animate-pulse' : 'border-primary-100 bg-primary-50 text-primary-600'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Time Left</p>
                    <p className="text-xl font-black font-mono tracking-tighter">{formatTime(timeLeft)}</p>
                  </div>
               </div>
            </div>

            {/* Questions Grid */}
            <form onSubmit={handleSubmit} className="space-y-16 pb-32">
              {groupedByPillar.map((pillarData) => (
                <div key={pillarData.pillar} className="space-y-10 group">
                  <div className="flex items-center space-x-6">
                    <div className="flex-none w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white text-2xl font-black shadow-xl group-hover:scale-110 transition-transform">
                      {pillarData.pillar}
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight">{pillarData.pillarName}</h2>
                       <p className="text-sm text-slate-400 font-medium uppercase tracking-[0.2em] mt-1">Strategic Foundation {pillarData.pillar}</p>
                    </div>
                  </div>

                  <div className="space-y-8 pl-8 md:pl-20 relative before:content-[''] before:absolute before:left-8 md:before:left-8 before:top-4 before:bottom-4 before:w-1 before:bg-slate-100">
                    {pillarData.subsections.map(({ section, questions: qs }) => {
                      const subsectionNameMatch = section.name.match(/^Pillar \d+_\d+ \((.+?)\)$/);
                      const subsectionName = subsectionNameMatch ? subsectionNameMatch[1] : section.name;
                      
                      return (
                        <div key={section._id} className="space-y-6 animate-in fade-in duration-500">
                          <h3 className="text-lg font-bold text-slate-800 ml-[-12px] pl-10 relative">
                             <div className="absolute left-[-5px] top-2 w-3 h-3 rounded-full bg-primary-500 ring-4 ring-white shadow-sm" />
                             {subsectionName}
                          </h3>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {qs.map((q) => {
                              const current = answers[q._id];
                              const questionLetter = orderToLetter(q.order);
                              
                              return (
                                <div key={q._id} className={`bg-white rounded-[2rem] p-8 border transition-all duration-300 ${current ? 'border-primary-200 shadow-md translate-x-1' : 'border-slate-100 shadow-sm hover:border-slate-300'}`}>
                                  <div className="flex items-start gap-4 mb-6">
                                     <span className="flex-none px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold font-mono uppercase tracking-widest">{questionLetter}</span>
                                     <p className="text-[17px] font-semibold text-slate-800 leading-snug">{q.text}</p>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-3">
                                    {[1, 2, 3, 4, 5].map((val) => {
                                      const labels: Record<number, string> = { 1: 'Strongly Disagree', 2: 'Disagree', 3: 'Neutral', 4: 'Agree', 5: 'Strongly Agree' };
                                      const active = current === val;
                                      return (
                                        <button
                                          key={val}
                                          type="button"
                                          onClick={() => setAnswer(q._id, val as NumericRating)}
                                          disabled={expired}
                                          className={`relative group flex-1 min-w-[140px] px-4 py-4 rounded-2xl text-sm font-bold border transition-all duration-200 text-center ${
                                            active
                                              ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30'
                                              : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:border-primary-500 hover:text-primary-600'
                                          }`}
                                        >
                                          <div className="flex flex-col items-center">
                                            <span className="text-xs opacity-60 mb-0.5 uppercase tracking-tighter">{labels[val]}</span>
                                            <span className="text-lg">{val}</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Submit CTA */}
              <div className="fixed bottom-10 left-0 w-full px-6 z-40">
                <div className="max-w-xl mx-auto bg-slate-900 rounded-[2.5rem] shadow-2xl p-4 flex items-center justify-between gap-6 border border-slate-800">
                   <div className="pl-6 text-slate-400">
                      <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Status</p>
                      <p className="text-white font-bold">{Object.values(answers).filter(Boolean).length} of {totalQuestions} Answered</p>
                   </div>
                   <button
                    type="submit"
                    disabled={expired || submitting || totalQuestions === 0}
                    className="bg-primary-500 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-400 hover:translate-y-[-2px] transition-all active:scale-[0.98] disabled:opacity-40"
                   >
                    {submitting ? 'Transmitting Data...' : 'Final Submission'}
                   </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


