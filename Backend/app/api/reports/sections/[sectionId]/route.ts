import { NextRequest } from 'next/server';
import { getSectionReport } from '@/controllers/reportController';

export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  return getSectionReport(request, { params });
}

