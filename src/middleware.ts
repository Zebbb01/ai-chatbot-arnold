// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // This function runs only when the user is authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user has a valid token
        return !!token;
      },
    },
    pages: {
      signIn: '/signin', // Redirect to custom sign-in page
    },
  }
);

// Protect all routes under /chat and the main page
export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/api/chat/:path*',
    '/api/conversations/:path*',
    '/api/google-calendar/:path*'
  ]
};