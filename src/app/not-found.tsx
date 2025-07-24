// src\app\not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary p-4">
      <h1 className="text-6xl font-bold mb-4 text-accent">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-text-secondary mb-8 text-center max-w-md">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" className="px-6 py-3 bg-accent text-accent-foreground rounded-md hover:bg-accent/50 transition-colors shadow-medium">
        Go to Home
      </Link>
    </div>
  );
}