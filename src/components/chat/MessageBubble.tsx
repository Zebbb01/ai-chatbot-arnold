// src/components/chat/MessageBubble.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  const messageVariants: Variants = {
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
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

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
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col space-y-2">
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm ${
              isUser
                ? 'bg-blue-500 text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Use ReactMarkdown to render the content */}
            <div className="prose dark:prose-invert text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown
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
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                title="Copy message"
              >
                <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </button>
              <button
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                title="Good response"
              >
                <ThumbsUp className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
              </button>
              <button
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                title="Bad response"
              >
                <ThumbsDown className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}