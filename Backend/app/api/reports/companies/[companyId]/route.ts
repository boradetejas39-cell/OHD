import { NextRequest } from 'next/server';
import { getCompanyReport } from '@/controllers/reportController';

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  return getCompanyReport(request, { params });
}

