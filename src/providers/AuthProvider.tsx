// src/components/AuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import SessionMonitor from '../components/auth/SessionMonitor';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      // Only refetch session every 10 minutes instead of 5
      refetchInterval={10 * 60}
      // Disable refetch on window focus to prevent unnecessary requests
      refetchOnWindowFocus={false}
    >
      <SessionMonitor />
      {children}
    </SessionProvider>
  );
}