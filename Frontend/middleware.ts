import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // For cross-domain scenarios, handle auth client-side
  // Only redirect from login to dashboard if token exists
  if (pathname.startsWith('/admin/login') && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Allow all other admin routes - handle auth client-side
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

