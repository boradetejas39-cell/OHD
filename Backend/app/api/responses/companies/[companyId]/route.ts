import { NextRequest } from 'next/server';
import { getCompanyResponses } from '@/controllers/responseController';

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  return getCompanyResponses(request, { params });
}

