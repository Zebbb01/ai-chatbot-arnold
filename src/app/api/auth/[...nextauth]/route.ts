// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/drizzle/schema";

export const authOptions: AuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        
        // Check if session has expired (1 hour = 3600 seconds)
        const now = Math.floor(Date.now() / 1000);
        const sessionExpiry = token.exp as number;
        
        if (now > sessionExpiry) {
          // Session has expired, return null to force re-authentication
          throw new Error('Session expired');
        }
        
        // Don't store access token in session for security
        // We'll fetch it from database when needed
      }
      return session;
    },
    async jwt({ token, account, user }) {
      const now = Math.floor(Date.now() / 1000);
      
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at,
          // Set session expiry to 1 hour from now
          exp: now + 3600, // 1 hour in seconds
          iat: now,
        };
      }

      // Check if session has expired
      if (token.exp && now > (token.exp as number)) {
        // Session expired, return null to force re-authentication
        return {};
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number) * 1000) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log('User signed in:', user.email);
      console.log('Account provider:', account?.provider);
      console.log('Account access token exists:', !!account?.access_token);
      console.log('Account scope:', account?.scope);
    },
    async signOut({ token }) {
      console.log('User signed out, session expired');
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // Set session max age to 1 hour (3600 seconds)
    maxAge: 3600,
    // Don't update session automatically to reduce requests
    updateAge: 0,
  },
  pages: {
    signIn: '/signin',
  },
};

async function refreshAccessToken(token: any) {
  try {
    const url = "https://oauth2.googleapis.com/token";

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    const now = Math.floor(Date.now() / 1000);

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      // Keep original session expiry - don't extend it
      exp: token.exp,
      iat: token.iat,
    };
  } catch (error) {
    console.log("Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };