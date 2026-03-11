import { NextRequest } from 'next/server';
import { sendBulkMail } from '@/controllers/mailController';

export async function POST(request: NextRequest) {
  return sendBulkMail(request);
}

