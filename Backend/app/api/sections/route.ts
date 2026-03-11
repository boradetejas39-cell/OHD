import { NextRequest } from 'next/server';
import { getSections, createSection } from '@/controllers/sectionController';

export async function GET(request: NextRequest) {
  return getSections(request);
}

export async function POST(request: NextRequest) {
  return createSection(request);
}

