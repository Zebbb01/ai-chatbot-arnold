// src/components/chat/MessageBubble.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

const MessageBubble = React.memo(function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  const messageVariants: Variants = React.useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.4
      }
    },
  }), []);

  const copyToClipboard = React.useCallback(() => {
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }, [content]);

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'ml-3' : 'mr-3'}`}>
          {isUser ? (
            // User avatar: Use primary accent color
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" /> {/* Icon color */}
            </div>
          ) : (
            // Assistant avatar: Use primary accent color
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" /> {/* Icon color */}
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col space-y-2">
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm ${
              isUser
                // User message bubble: Use primary background and foreground
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                // Assistant message bubble: Use secondary background, foreground, and border
                : 'bg-secondary text-foreground rounded-bl-sm border border-border'
            }`}
          >
            {/* Prose styling can be complex with Tailwind/Shadcn, but text color should default from parent */}
            <div className="prose dark:prose-invert text-sm leading-relaxed text-inherit"> {/* text-inherit to ensure it gets color from parent bubble */}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Action buttons for assistant messages */}
          {!isUser && (
            <div className="flex items-center space-x-2 ml-2">
              <button
                onClick={copyToClipboard}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors group"
                title="Copy message"
              >
                <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              </button>
              <button
                className="p-1.5 hover:bg-accent rounded-lg transition-colors group"
                title="Good response"
              >
                {/* ThumbsUp can retain a custom color if desired, or use primary/success */}
                <ThumbsUp className="w-4 h-4 text-muted-foreground group-hover:text-green-500" />
              </button>
              <button
                className="p-1.5 hover:bg-accent rounded-lg transition-colors group"
                title="Bad response"
              >
                {/* ThumbsDown can retain a custom color if desired, or use destructive */}
                <ThumbsDown className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default MessageBubble;