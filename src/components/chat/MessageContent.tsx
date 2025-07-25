// src\components\chat\MessageContent.tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markdownComponents } from './markdown/MarkdownComponents'; // Import the new file

interface MessageContentProps {
  content: string;
  isUser: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ content, isUser }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl px-4 py-3 border relative group",
      isUser
        ? "bg-primary text-primary-foreground rounded-br-sm"
        : "bg-secondary text-foreground border-border rounded-bl-sm"
    )}>
      {isUser ? (
        // User messages - simple text
        <p className="text-sm whitespace-pre-wrap break-words">
          {content}
        </p>
      ) : (
        // Assistant messages - enhanced markdown rendering
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={markdownComponents}
            remarkPlugins={[]}
            rehypePlugins={[]}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 p-1.5 rounded-md transition-all duration-200 opacity-0 group-hover:opacity-100",
          "hover:bg-black/10 dark:hover:bg-white/10",
          "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
        )}
        title={copied ? "Copied!" : "Copy message"}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className={cn(
            "w-3.5 h-3.5",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )} />
        )}
      </button>
    </div>
  );
};

export default MessageContent;