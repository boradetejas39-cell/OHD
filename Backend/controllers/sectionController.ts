import { NextRequest, NextResponse } from 'next/server';
import Section from '@/models/Section';
import connectDB from '@/lib/db';
import { requireAdmin } from '@/Backend/middleware/auth';

export async function getSections(request: NextRequest) {
  try {
    await connectDB();
    // Public endpoint - no admin auth required for survey access

    const sections = await Section.find().sort({ pillar: 1, order: 1 });
    return NextResponse.json({ sections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch sections' }, { status: 500 });
  }
}

export async function createSection(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);

    const body = await request.json();
    const { name, description, pillar, order } = body;

    if (!name || pillar === undefined || order === undefined) {
      return NextResponse.json({ error: 'Name, pillar, and order are required' }, { status: 400 });
    }

    if (pillar < 1 || pillar > 5) {
      return NextResponse.json({ error: 'Pillar must be between 1 and 5' }, { status: 400 });
    }

    const section = await Section.create({
      name,
      description,
      pillar,
      order,
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create section' }, { status: 500 });
  }
}

