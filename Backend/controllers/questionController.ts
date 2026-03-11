import { NextRequest, NextResponse } from 'next/server';
import Question from '@/models/Question';
import Section from '@/models/Section';
import connectDB from '@/lib/db';
import { requireAdmin } from '@/Backend/middleware/auth';

export async function getQuestions(request: NextRequest) {
  try {
    await connectDB();
    // Public endpoint - no admin auth required for survey access

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    const query: any = {};
    if (sectionId) {
      query.sectionId = sectionId;
    }

    const questions = await Question.find(query).populate('sectionId', 'name pillar order').sort({ order: 1 });
    return NextResponse.json({ questions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function createQuestion(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);

    const body = await request.json();
    const { sectionId, text, order } = body;

    if (!sectionId || !text || order === undefined) {
      return NextResponse.json({ error: 'Section ID, text, and order are required' }, { status: 400 });
    }

    // Verify section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const question = await Question.create({
      sectionId,
      text,
      order,
    });

    const populatedQuestion = await Question.findById(question._id).populate('sectionId', 'name');

    return NextResponse.json({ question: populatedQuestion }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create question' }, { status: 500 });
  }
}

