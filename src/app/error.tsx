// src/app/error.tsx
'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary p-4">
      <h1 className="text-6xl font-bold mb-4 text-accent-orange">Error</h1>
      <h2 className="text-2xl font-semibold mb-6">Something went wrong!</h2>
      <p className="text-text-secondary mb-8 text-center max-w-md">
        We encountered an unexpected issue. Please try again or go back to the home page.
      </p>
      <div className="flex gap-4">
        <button
          className="px-6 py-3 bg-accent text-accent-foreground rounded-md hover:bg-accent/50 transition-colors shadow-medium"
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again
        </button>
        <Link href="/" className="px-6 py-3 border border-border-light text-text-primary rounded-md hover:bg-bg-secondary transition-colors shadow-light">
          Go to Home
        </Link>
      </div>
      {/* Optionally display error details in development */}
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-8 p-4 bg-bg-secondary text-text-secondary rounded-md overflow-auto max-w-xl">
          <code>{error.message}</code>
        </pre>
      )}
    </div>
  );
}