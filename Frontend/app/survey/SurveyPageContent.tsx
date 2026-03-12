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

export default function SurveyPageContent() {
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get('companyId') || '';

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, NumericRating>>({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);

  const currentSection = sections[currentSectionIndex];
  const currentQuestion = questions.find(q => 
    typeof q.sectionId === 'object' ? q.sectionId._id === currentSection?._id : q.sectionId === currentSection?._id
  );

  // Load company and sections
  useEffect(() => {
    if (!initialCompanyId) {
      setLoadingMeta(false);
      return;
    }
    const loadMeta = async () => {
      try {
        const [companyRes, sectionsRes] = await Promise.all([
          companyAPI.getById(initialCompanyId),
          sectionAPI.getAll()
        ]);
        setCompany(companyRes.data);
        setSections(sectionsRes.data.sort((a: Section, b: Section) => a.order - b.order));
      } catch (error: unknown) {
        console.error('Failed to load metadata', error);
        const message = error instanceof Error ? error.message : 'Failed to load metadata';
        toast.error(message);
      } finally {
        setLoadingMeta(false);
      }
    };
    loadMeta();
  }, [initialCompanyId]);

  // Load questions when current section changes
  useEffect(() => {
    if (!currentSection) return;
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const res = await questionAPI.getAll(currentSection._id);
        setQuestions(res.data.sort((a: Question, b: Question) => a.order - b.order));
        setCurrentQuestionIndex(0);
      } catch (error: unknown) {
        console.error('Failed to load questions', error);
        const message = error instanceof Error ? error.message : 'Failed to load questions';
        toast.error(message);
      } finally {
        setLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, [currentSection]);

  // Timer
  useEffect(() => {
    if (!started || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, isSubmitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRating = (questionId: string, rating: NumericRating) => {
    setRatings(prev => ({ ...prev, [questionId]: rating }));
  };

  const handleNextQuestion = () => {
    if (!currentQuestion) return;
    if (!ratings[currentQuestion._id]) {
      toast.error('Please rate this question before proceeding');
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Move to next section
      if (currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(prev => prev + 1);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      // Will be reset to last question of previous section when questions load
    }
  };

  const handleSubmit = async () => {
    if (!company) return;
    setSubmitting(true);
    try {
      const responses = Object.entries(ratings).map(([questionId, rating]) => ({
        questionId,
        rating: numericToLetterRating(rating),
        companyId: company._id,
      }));
      await responseAPI.submit({
        companyId: company._id,
        responses
      });
      setIsSubmitted(true);
      toast.success('Survey submitted successfully!');
    } catch (error: unknown) {
      console.error('Failed to submit survey', error);
      const message = error instanceof Error ? error.message : 'Failed to submit survey';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => {
    const totalQuestions = sections.reduce((sum, section) => {
      const sectionQuestions = questions.filter(q => 
        typeof q.sectionId === 'object' ? q.sectionId._id === section._id : q.sectionId === section._id
      );
      return sum + sectionQuestions.length;
    }, 0);
    const answeredQuestions = Object.keys(ratings).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }, [sections, questions, ratings]);

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Survey Link</h1>
          <p className="text-gray-600">Please check your survey link and try again.</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">Your survey responses have been submitted successfully.</p>
          <div className="text-sm text-gray-500">
            <p>Company: {company.name}</p>
            <p>Questions answered: {Object.keys(ratings).length}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Image src="/logo.png" alt="Logo" width={80} height={80} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Organizational Health Diagnostic</h1>
            <p className="text-gray-600">{company.name}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Survey Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• This survey takes approximately 30 minutes</li>
              <li>• Please answer all questions honestly</li>
              <li>• Your responses are confidential</li>
              <li>• You cannot pause once started</li>
            </ul>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Survey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{company.name}</h1>
              <p className="text-sm text-gray-600">Organizational Health Diagnostic</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-sm font-medium ${timeLeft < 300 ? 'text-red-600' : 'text-gray-600'}`}>
                Time: {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-600">
                Progress: {Math.round(progress)}%
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loadingQuestions ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        ) : !currentQuestion ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No questions available for this section.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Section Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentSection?.name || 'Survey'}
                </h2>
                <span className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {currentQuestion.text}
              </h3>

              {/* Rating Scale */}
              <div className="flex justify-between items-center">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRating(currentQuestion._id, rating as NumericRating)}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                      ratings[currentQuestion._id] === rating
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl font-bold mb-1">{rating}</span>
                    <span className="text-xs text-gray-600">
                      {rating === 1 ? 'Strongly Disagree' :
                       rating === 2 ? 'Disagree' :
                       rating === 3 ? 'Neutral' :
                       rating === 4 ? 'Agree' : 'Strongly Agree'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentSectionIndex === sections.length - 1 && 
               currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || Object.keys(ratings).length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Survey'}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
