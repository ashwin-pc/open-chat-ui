import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MarkdownPreviewProps {
  code: string;
  theme: 'light' | 'dark';
}

export function MarkdownPreview({ code, theme }: MarkdownPreviewProps) {
  const components: Components = {
    a: ({ node, children, ...props }) => (
      <a
        className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
        {...props}
      >
        {children}
      </a>
    ),
    h1: ({ node, children, ...props }) => (
      <h1 className={`text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} {...props}>
        {children}
      </h1>
    ),
    h2: ({ node, children, ...props }) => (
      <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} {...props}>
        {children}
      </h2>
    ),
    h3: ({ node, children, ...props }) => (
      <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} {...props}>
        {children}
      </h3>
    ),
    ul: ({ node, children, ...props }) => (
      <ul className="list-disc list-inside mb-4" {...props}>
        {children}
      </ul>
    ),
    ol: ({ node, children, ...props }) => (
      <ol className="list-decimal list-inside mb-4" {...props}>
        {children}
      </ol>
    ),
    p: ({ node, children, ...props }) => (
      <p className={`mb-4 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} {...props}>
        {children}
      </p>
    ),
    blockquote: ({ node, children, ...props }) => (
      <blockquote
        className={`border-l-4 pl-4 italic my-4 ${
          theme === 'dark' ? 'border-blue-400 text-gray-300' : 'border-blue-500 text-gray-700'
        }`}
        {...props}
      >
        {children}
      </blockquote>
    ),
  };

  return (
    <ScrollArea className="h-full">
      <div className={`max-w-none p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <ReactMarkdown components={components}>{code}</ReactMarkdown>
      </div>
    </ScrollArea>
  );
}
