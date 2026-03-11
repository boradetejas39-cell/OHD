import { NextRequest, NextResponse } from 'next/server';
import Company from '@/models/Company';
import connectDB from '@/lib/db';
import { requireAdmin } from '@/Backend/middleware/auth';

export async function getCompanies(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);

    const companies = await Company.find().sort({ createdAt: -1 });
    return NextResponse.json({ companies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function createCompany(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);

    const body = await request.json();
    const { name, email, industry, employeeCount } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return NextResponse.json({ error: 'Company with this email already exists' }, { status: 400 });
    }

    const company = await Company.create({
      name,
      email,
      industry,
      employeeCount: employeeCount || 0,
      status: 'active',
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create company' }, { status: 500 });
  }
}

export async function getCompanyById(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    // Public endpoint - no admin auth required for survey access

    const company = await Company.findById(params.id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch company' }, { status: 500 });
  }
}

export async function updateCompany(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    requireAdmin(request);

    const body = await request.json();
    const { name, email, industry, employeeCount, status } = body;

    const company = await Company.findById(params.id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check email uniqueness if email is being updated
    if (email && email !== company.email) {
      const existingCompany = await Company.findOne({ email });
      if (existingCompany) {
        return NextResponse.json({ error: 'Company with this email already exists' }, { status: 400 });
      }
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      params.id,
      { name, email, industry, employeeCount, status },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ company: updatedCompany });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update company' }, { status: 500 });
  }
}

export async function deleteCompany(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    requireAdmin(request);

    const company = await Company.findById(params.id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    await Company.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete company' }, { status: 500 });
  }
}

