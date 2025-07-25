// src/components/auth/SessionMonitor.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionMonitor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const lastActivityRef = useRef<number>(Date.now());
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionUpdateRef = useRef<number>(Date.now());

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check if user has been inactive for more than 1 hour
  const checkInactivity = useCallback(async () => {
    const now = Date.now();
    const inactiveTime = now - lastActivityRef.current;
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    if (inactiveTime >= oneHour) {
      console.log('User has been inactive for 1 hour, signing out...');
      await signOut({ redirect: false });
      router.push('/signin?message=Session expired due to inactivity');
    }
  }, [router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    // Activity event listeners - only track meaningful user interactions
    const events = ['click', 'keydown', 'scroll'];

    // Throttled activity update to prevent excessive calls
    let activityTimeout: NodeJS.Timeout;
    const throttledUpdateActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(updateActivity, 1000); // Throttle to once per second
    };

    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, { passive: true });
    });

    // Check for inactivity every 10 minutes instead of 5
    sessionCheckIntervalRef.current = setInterval(checkInactivity, 10 * 60 * 1000);

    // Cleanup function
    return () => {
      clearTimeout(activityTimeout);
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity);
      });

      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, [status, updateActivity, checkInactivity]);

  // Handle session errors (expired tokens, etc.)
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Clear any existing intervals
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    }
  }, [status]);

  // This component doesn't render anything
  return null;
}