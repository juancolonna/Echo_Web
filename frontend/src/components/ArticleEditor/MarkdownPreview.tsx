"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = "" }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <div className={`flex items-center justify-center py-20 text-[var(--text-muted)] text-sm ${className}`}>
        A pré-visualização aparecerá aqui...
      </div>
    );
  }

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
