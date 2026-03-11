import { NextRequest } from 'next/server';
import { signup } from '@/controllers/authController';

export async function POST(request: NextRequest) {
  return signup(request);
}

