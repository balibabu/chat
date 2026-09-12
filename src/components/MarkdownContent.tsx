import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CopyButton } from './CopyButton';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  return (
    <div className="text-zinc-100 text-sm sm:text-base leading-relaxed break-words space-y-3">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 text-zinc-100">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2 text-zinc-100">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium mt-2 mb-1 text-zinc-200">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-200">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-200">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-indigo-500/60 pl-3 italic text-zinc-400 my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-zinc-800 rounded-lg">
              <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-900">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 font-medium text-zinc-300">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-zinc-400">{children}</td>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-indigo-300 font-mono text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            return (
              <div className="my-3 rounded-lg border border-zinc-800 bg-zinc-900/90 overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800/80 text-zinc-400 text-[11px]">
                  <span>{lang || 'code'}</span>
                  <CopyButton text={codeString} title="Copy code" />
                </div>
                <div className="p-3 overflow-x-auto text-zinc-200">
                  <pre className="m-0 p-0 font-mono">
                    <code>{codeString}</code>
                  </pre>
                </div>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
