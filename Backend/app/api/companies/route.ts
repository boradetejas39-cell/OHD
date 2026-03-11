import { NextRequest } from 'next/server';
import { getCompanies, createCompany } from '@/controllers/companyController';

export async function GET(request: NextRequest) {
  return getCompanies(request);
}

export async function POST(request: NextRequest) {
  return createCompany(request);
}

