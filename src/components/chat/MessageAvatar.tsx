// src\components\chat\MessageAvatar.tsx
import React from 'react';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageAvatarProps {
  isUser: boolean;
}

const MessageAvatar: React.FC<MessageAvatarProps> = ({ isUser }) => (
  <div className={cn(
    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
    isUser ? "bg-primary" : "bg-primary" // Assuming both user and bot avatars have the same background for now
  )}>
    {isUser ? (
      <User className="w-4 h-4 text-primary-foreground" />
    ) : (
      <Bot className="w-4 h-4 text-primary-foreground" />
    )}
  </div>
);

export default MessageAvatar;