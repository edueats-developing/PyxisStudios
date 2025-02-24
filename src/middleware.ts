import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow access to the homepage and static files
  if (
    pathname === '/' || 
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/edueats_logo') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Redirect all other routes to the homepage
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: '/:path*',
};
