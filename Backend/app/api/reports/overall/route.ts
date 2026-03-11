import { NextRequest } from 'next/server';
import { getOverallReport } from '@/controllers/reportController';

export async function GET(request: NextRequest) {
  return getOverallReport(request);
}

