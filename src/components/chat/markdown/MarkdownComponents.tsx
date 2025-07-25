// src\components\chat\markdown\MarkdownComponents.tsx
import React from 'react';
import type { Components } from 'react-markdown';

// Define a helper component for external links with an icon
const ExternalLink: React.FC<{ href?: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/60 hover:decoration-primary/80 transition-colors duration-200 font-medium"
  >
    {children}
    {href?.startsWith('http') && (
      <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    )}
  </a>
);

// Define markdown components with proper types
export const markdownComponents: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-lg font-bold text-foreground mt-4 mb-2 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-foreground mt-3 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-medium text-foreground mt-2 mb-1 first:mt-0">
      {children}
    </h3>
  ),

  // Paragraphs with proper spacing
  p: ({ children }) => (
    <p className="text-sm text-foreground mb-1 last:mb-0 leading-relaxed">
      {children}
    </p>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="text-sm text-foreground mb-2 last:mb-0 pl-4 space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-sm text-foreground mb-2 last:mb-0 pl-4 space-y-1 list-decimal">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-foreground leading-relaxed">
      {children}
    </li>
  ),

  // Strong/Bold text
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">
      {children}
    </strong>
  ),

  // Emphasis/Italic text
  em: ({ children }) => (
    <em className="italic text-muted-foreground">
      {children}
    </em>
  ),

  // Code blocks - simplified approach
  code: ({ className, children, ...props }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-foreground font-mono" {...props}>
      {children}
    </code>
  ),

  // Pre blocks for code blocks
  pre: ({ children }) => (
    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto mb-2 last:mb-0">
      {children}
    </pre>
  ),

  // Enhanced Links with better styling
  a: ({ href, children }) => (
    <ExternalLink href={href}>{children}</ExternalLink>
  ),

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 py-2 mb-2 last:mb-0 bg-muted/50 rounded-r">
      <div className="text-sm text-muted-foreground">
        {children}
      </div>
    </blockquote>
  ),

  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto mb-2 last:mb-0">
      <table className="min-w-full border border-border rounded-lg">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-muted/50">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-medium text-foreground uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-sm text-foreground">
      {children}
    </td>
  ),

  // Horizontal rule
  hr: () => (
    <hr className="border-t border-border my-3" />
  ),

  // Line breaks
  br: () => <br className="mb-1" />,
};