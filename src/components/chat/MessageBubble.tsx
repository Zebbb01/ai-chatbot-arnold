// src/components/chat/MessageBubble.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import MessageContent from './MessageContent';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content }) => {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div className={`flex items-start max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-accent-foreground border border-border'
            }`}
          >
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Optional: Add sender name for clarity */}
          <div className={`text-xs text-muted-foreground mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {isUser ? 'You' : 'Arnold'}
          </div>
          
          <MessageContent content={content} isUser={isUser} />
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;