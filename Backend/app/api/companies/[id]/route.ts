import { NextRequest } from 'next/server';
import { getCompanyById, updateCompany, deleteCompany } from '@/controllers/companyController';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return getCompanyById(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateCompany(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return deleteCompany(request, { params });
}

