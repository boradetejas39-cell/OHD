import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAdmin } from '@/Backend/middleware/auth';
import { sendBulkEmails, generateSurveyEmail } from '@/services/mailService';
import MailLog from '@/models/MailLog';
import * as XLSX from 'xlsx';

export async function sendBulkMail(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const subject = formData.get('subject') as string;
    const companyId = formData.get('companyId') as string | null;
    const surveyLink = formData.get('surveyLink') as string;
    const service = formData.get('service') as string;
    const companyName = formData.get('companyName') as string || 'Your Organization';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!subject || !surveyLink) {
      return NextResponse.json({ error: 'Subject and survey link are required' }, { status: 400 });
    }

    // Extract emails from file
    const emails: string[] = [];
    const fileBuffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      // Parse CSV
      const text = Buffer.from(fileBuffer).toString('utf-8');
      const lines = text.split('\n');

      // Assume first column contains emails, or look for email pattern
      for (const line of lines) {
        if (line.trim()) {
          const columns = line.split(',').map((col) => col.trim().replace(/^"|"$/g, ''));
          // Try to find email in columns
          for (const col of columns) {
            if (col.includes('@') && col.includes('.')) {
              emails.push(col.toLowerCase());
              break;
            }
          }
        }
      }
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Parse Excel
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Find email column (assume first row is header)
      let emailColumnIndex = -1;
      if (data.length > 0) {
        const headerRow = data[0] as any[];
        emailColumnIndex = headerRow.findIndex((cell: any) =>
          cell && (cell.toString().toLowerCase().includes('email') || cell.toString().toLowerCase().includes('mail'))
        );
      }

      // Extract emails
      for (let i = 1; i < data.length; i++) {
        const row = data[i] as any[];
        if (emailColumnIndex >= 0 && row[emailColumnIndex]) {
          const email = row[emailColumnIndex].toString().trim().toLowerCase();
          if (email.includes('@') && email.includes('.')) {
            emails.push(email);
          }
        } else {
          // Try to find email in any column
          for (const cell of row) {
            if (cell && cell.toString().includes('@') && cell.toString().includes('.')) {
              emails.push(cell.toString().trim().toLowerCase());
              break;
            }
          }
        }
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Please upload CSV or Excel file.' }, { status: 400 });
    }

    if (emails.length === 0) {
      return NextResponse.json({ error: 'No valid emails found in the file' }, { status: 400 });
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];

    // Generate email HTML
    const html = generateSurveyEmail(companyName, surveyLink, service);

    // Send bulk emails
    const result = await sendBulkEmails(uniqueEmails, subject, html, companyId || undefined, service);

    return NextResponse.json({
      message: 'Bulk email sending completed',
      total: uniqueEmails.length,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send bulk emails' }, { status: 500 });
  }
}

export async function getMailLogs(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = {};
    if (companyId) {
      query.companyId = companyId;
    }
    if (status) {
      query.status = status;
    }

    const logs = await MailLog.find(query)
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await MailLog.countDocuments(query);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch mail logs' }, { status: 500 });
  }
}

