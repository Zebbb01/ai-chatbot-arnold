// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default withAuth(
  async function middleware(req) {
    // Get the token to check expiry
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Check if token exists and hasn't expired
    if (token) {
      const now = Math.floor(Date.now() / 1000);
      const tokenExpiry = token.exp as number;

      // If token has expired, redirect to sign-in with expiry message
      if (tokenExpiry && now > tokenExpiry) {
        const signInUrl = new URL('/signin', req.url);
        signInUrl.searchParams.set('message', 'Session expired');
        signInUrl.searchParams.set('callbackUrl', req.url);
        return NextResponse.redirect(signInUrl);
      }
    }

    // This function runs only when the user is authenticated and session is valid
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: async ({ token, req }) => {
        // Check if user has a valid token
        if (!token) return false;

        // Check token expiry
        const now = Math.floor(Date.now() / 1000);
        const tokenExpiry = token.exp as number;

        // Return false if token has expired
        if (tokenExpiry && now > tokenExpiry) {
          return false;
        }

        return true;
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
  ]
};