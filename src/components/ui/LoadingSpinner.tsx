// src/components/ui/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

export default function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={`inline-block ${className}`}>
      <div className="animate-spin rounded-full border-2 border-current border-t-transparent w-4 h-4">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}