import { NextRequest } from 'next/server';
import { submitResponse } from '@/controllers/responseController';

export async function POST(request: NextRequest) {
  return submitResponse(request);
}

