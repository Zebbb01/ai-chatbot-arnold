// src/app/(chat)/layout.tsx
import React from 'react';

// You can add metadata specific to this route group here if needed
export const metadata = {
  title: 'Chat Session',
  description: 'Your ongoing AI chat session',
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This div provides a context for the chat layout.
    // For instance, you could add a sidebar component here:
    // <div className="flex h-screen">
    //   <aside className="w-64 bg-gray-800 text-white p-4">
    //     <h2 className="text-xl font-bold mb-4">Conversations</h2>
    //     {/* Add a list of past conversations here */}
    //   </aside>
    //   <main className="flex-1">{children}</main>
    // </div>
    <div className="flex flex-col h-screen">
      {children}
    </div>
  );
}