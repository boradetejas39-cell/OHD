import { NextRequest } from 'next/server';
import { exportExcel } from '@/controllers/exportController';

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  return exportExcel(request, { params });
}

