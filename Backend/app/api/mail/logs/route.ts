import { NextRequest } from 'next/server';
import { getMailLogs } from '@/controllers/mailController';

export async function GET(request: NextRequest) {
  return getMailLogs(request);
}

