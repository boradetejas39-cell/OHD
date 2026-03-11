import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAdmin } from '@/Backend/middleware/auth';
import { calculateQuestionStats, calculateSectionStats, calculateOverallStats } from '@/utils/calculations';

export async function getCompanyReport(request: NextRequest, { params }: { params: { companyId: string } }) {
  try {
    await connectDB();
    requireAdmin(request);

    const overallStats = await calculateOverallStats(params.companyId);
    const sections = await (await import('@/models/Section')).default.find().sort({ order: 1 });
    const sectionStats = [];

    for (const section of sections) {
      const stats = await calculateSectionStats(section._id.toString(), params.companyId);
      sectionStats.push(stats);
    }

    return NextResponse.json({
      companyId: params.companyId,
      overallStats,
      sectionStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate company report' }, { status: 500 });
  }
}

export async function getSectionReport(request: NextRequest, { params }: { params: { sectionId: string } }) {
  try {
    await connectDB();
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const sectionStats = await calculateSectionStats(params.sectionId, companyId || undefined);

    return NextResponse.json({
      sectionStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate section report' }, { status: 500 });
  }
}

export async function getOverallReport(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const overallStats = await calculateOverallStats(companyId || undefined);
    const sections = await (await import('@/models/Section')).default.find().sort({ order: 1 });
    const sectionStats = [];

    for (const section of sections) {
      const stats = await calculateSectionStats(section._id.toString(), companyId || undefined);
      sectionStats.push(stats);
    }

    return NextResponse.json({
      overallStats,
      sectionStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate overall report' }, { status: 500 });
  }
}

