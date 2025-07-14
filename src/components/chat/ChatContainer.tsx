// src/components/chat/ChatContainer.tsx
import React from 'react';

interface ChatContainerProps {
  children: React.ReactNode;
}

export default function ChatContainer({ children }: ChatContainerProps) {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 antialiased">
      {children}
    </div>
  );
}