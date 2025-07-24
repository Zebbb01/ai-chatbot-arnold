// src/app/test-error/page.tsx
'use client'; // This component will throw an error on the client side

export default function TestErrorPage() {
  // This will throw an error when the component renders
  // In a real app, this would be an unexpected error, e.g., a prop being undefined
  // or a failed API call that isn't caught.
  throw new Error('This is a simulated runtime error!');

  return (
    <div>
      <h1>This page should not be seen if the error.tsx works!</h1>
    </div>
  );
}