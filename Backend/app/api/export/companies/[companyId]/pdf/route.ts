import { NextRequest } from 'next/server';
import { exportPDF } from '@/controllers/exportController';

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  return exportPDF(request, { params });
}

