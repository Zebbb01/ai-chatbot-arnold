// src/components/chat/ChatContainer.tsx
import React from 'react';

interface ChatContainerProps {
  children: React.ReactNode;
}

// ✅ Optimization: React.memo for a simple, presentational component
// Prevents re-renders if its children (which are dynamic) don't actually change
// However, given `children` is likely always new content, its impact here is minimal.
const ChatContainer = React.memo(function ChatContainer({ children }: ChatContainerProps) {
  return (
    <div className="flex flex-col h-full bg-background antialiased">
      {children}
    </div>
  );
});

export default ChatContainer;