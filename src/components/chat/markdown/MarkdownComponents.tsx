// src/components/chat/markdown/MarkdownComponents.tsx
import React from 'react';
import type { Components } from 'react-markdown';
import { ExternalLink, Calendar, MapPin, Clock } from 'lucide-react';

// Enhanced external link component with better styling
const EnhancedExternalLink: React.FC<{ href?: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/60 hover:decoration-primary/80 transition-all duration-200 font-medium hover:gap-2"
  >
    {children}
    {href?.startsWith('http') && (
      <ExternalLink className="w-3.5 h-3.5 opacity-70 transition-opacity hover:opacity-100" />
    )}
  </a>
);

// Enhanced code block with syntax highlighting appearance
const CodeBlock: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const language = className?.replace('language-', '') || '';
  
  return (
    <div className="relative group">
      {language && (
        <div className="absolute top-2 right-3 text-xs text-muted-foreground/60 font-mono">
          {language}
        </div>
      )}
      <pre className="bg-muted/80 border border-border p-4 rounded-lg text-sm overflow-x-auto mb-4 last:mb-0 font-mono leading-relaxed">
        <code className="text-foreground">{children}</code>
      </pre>
    </div>
  );
};

// Enhanced schedule event card component
const ScheduleCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-5 my-4 last:mb-0 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <Calendar className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
};

// Enhanced Pro Tip callout component
const ProTipCallout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 my-3 flex items-start gap-3">
    <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-xs text-accent-foreground font-bold">💡</span>
    </div>
    <div className="text-sm text-accent-foreground/90 leading-relaxed">
      {children}
    </div>
  </div>
);

// Success/Error status components
const StatusAlert: React.FC<{ type: 'success' | 'warning' | 'error'; children: React.ReactNode }> = ({ type, children }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
  };

  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div className={`border rounded-lg p-3 my-3 flex items-start gap-3 ${styles[type]}`}>
      <span className="text-lg">{icons[type]}</span>
      <div className="text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
};

// Define enhanced markdown components with better styling
export const markdownComponents: Components = {
  // Enhanced headings with better hierarchy
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-foreground mt-6 mb-4 first:mt-0 pb-2 border-b border-border">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-foreground mt-5 mb-3 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-medium text-foreground mt-4 mb-2 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-medium text-foreground mt-3 mb-2 first:mt-0">
      {children}
    </h4>
  ),

  // Enhanced paragraphs with smart status detection
  p: ({ children }) => {
    const childrenString = React.Children.toArray(children).map(child => 
      typeof child === 'string' ? child : ''
    ).join('');
    
    // Detect status messages
    if (childrenString.includes('✅') && childrenString.includes('Successfully')) {
      return <StatusAlert type="success">{children}</StatusAlert>;
    }
    if (childrenString.includes('⚠️') && (childrenString.includes('Note:') || childrenString.includes('Warning'))) {
      return <StatusAlert type="warning">{children}</StatusAlert>;
    }
    if (childrenString.includes('❌') && (childrenString.includes('Error') || childrenString.includes('Oops'))) {
      return <StatusAlert type="error">{children}</StatusAlert>;
    }
    
    // Regular paragraph
    return (
      <p className="text-sm text-foreground mb-3 last:mb-0 leading-relaxed">
        {children}
      </p>
    );
  },

  // Enhanced lists with better styling
  ul: ({ children }) => (
    <ul className="text-sm text-foreground mb-3 last:mb-0 pl-6 space-y-1.5 list-disc marker:text-primary/60">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-sm text-foreground mb-3 last:mb-0 pl-6 space-y-1.5 list-decimal marker:text-primary/60">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-foreground leading-relaxed">
      {children}
    </li>
  ),

  // Enhanced text formatting
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">
      {children}
    </strong>
  ),

  em: ({ children }) => (
    <em className="italic text-foreground/90">
      {children}
    </em>
  ),

  // Enhanced inline code
  code: ({ className, children, ...props }) => {
    // Check if it's a code block (has className) or inline code
    if (className?.startsWith('language-')) {
      return <CodeBlock className={className}>{children}</CodeBlock>;
    }
    
    return (
      <code
        className="bg-muted/80 text-foreground px-1.5 py-0.5 rounded text-xs font-mono border border-border"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Enhanced pre blocks
  pre: ({ children }) => (
    <CodeBlock>{children}</CodeBlock>
  ),

  // Enhanced links
  a: ({ href, children }) => (
    <EnhancedExternalLink href={href}>{children}</EnhancedExternalLink>
  ),

  // Enhanced blockquotes with special handling for Pro Tips and Status messages
  blockquote: ({ children }) => {
    const childrenString = React.Children.toArray(children).join('');
    
    // Check if it's a Pro Tip
    if (childrenString.includes('💡 Pro Tip') || childrenString.includes('Pro Tip')) {
      return <ProTipCallout>{children}</ProTipCallout>;
    }
    
    // Regular blockquote
    return (
      <blockquote className="border-l-4 border-primary/30 bg-primary/5 pl-4 pr-4 py-3 my-4 last:mb-0 rounded-r-lg">
        <div className="text-sm text-foreground/90 italic">
          {children}
        </div>
      </blockquote>
    );
  },

  // FIXED: Enhanced tables with proper display and overflow handling
  table: ({ children }) => (
    <div className="my-4 last:mb-0 overflow-x-auto rounded-lg border border-border shadow-sm bg-card">
      <table className="w-full table-auto border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50 border-b border-border">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-muted/30 transition-colors duration-150">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide border-r border-border last:border-r-0 bg-muted/30">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm text-foreground border-r border-border last:border-r-0 align-top whitespace-normal break-words">
      {children}
    </td>
  ),

  // Enhanced horizontal rule
  hr: () => (
    <hr className="border-t border-border my-6" />
  ),

  // Line breaks
  br: () => <br className="mb-1" />,

  // Custom component for handling schedule-specific content
  div: ({ className, children }) => {
    if (className === 'schedule-card') {
      return <ScheduleCard>{children}</ScheduleCard>;
    }
    return <div className={className}>{children}</div>;
  },
};