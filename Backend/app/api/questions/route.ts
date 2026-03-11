import { NextRequest } from 'next/server';
import { getQuestions, createQuestion } from '@/controllers/questionController';

export async function GET(request: NextRequest) {
  return getQuestions(request);
}

export async function POST(request: NextRequest) {
  return createQuestion(request);
}

