// src/components/chat/MessageBubble.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import MessageAvatar from './MessageAvatar'; // Import the new avatar component
import MessageContent from './MessageContent'; // Import the new content component

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

const MessageBubble = React.memo(function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex mb-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex items-start space-x-3 max-w-[85%]",
        isUser && "flex-row-reverse space-x-reverse"
      )}>
        {/* Avatar */}
        <MessageAvatar isUser={isUser} />

        {/* Message Content */}
        <MessageContent content={content} isUser={isUser} />
      </div>
    </motion.div>
  );
});

export default MessageBubble;