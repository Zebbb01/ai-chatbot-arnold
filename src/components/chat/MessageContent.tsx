// src/components/chat/MessageContent.tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markdownComponents } from './markdown/MarkdownComponents';

// Import remark-gfm
import remarkGfm from 'remark-gfm'; // <--- ADD THIS LINE

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
    <div
      className={cn(
        "relative group transition-all duration-200",
        isUser
          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 shadow-sm"
          : "bg-card text-card-foreground rounded-2xl rounded-bl-md px-4 py-3 border border-border shadow-sm hover:shadow-md"
      )}
    >
      {isUser ? (
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </div>
      ) : (
        <div className="prose prose-sm max-w-none prose-headings:text-card-foreground prose-p:text-card-foreground prose-strong:text-card-foreground prose-code:text-card-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border">
          <ReactMarkdown
            components={markdownComponents}
            remarkPlugins={[remarkGfm]} // <--- ADD/UPDATE THIS LINE
            rehypePlugins={[]}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}

      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 p-1.5 rounded-md transition-all duration-200",
          "opacity-0 group-hover:opacity-100 focus:opacity-100",
          "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          isUser
            ? "hover:bg-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
        title={copied ? "Copied!" : "Copy message"}
        aria-label={copied ? "Message copied" : "Copy message to clipboard"}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};

export default MessageContent;