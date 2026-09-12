import React, { useState, useEffect } from 'react';
import { Brain, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface ReasoningBlockProps {
  reasoning: string;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
}

export const ReasoningBlock: React.FC<ReasoningBlockProps> = ({
  reasoning,
  isStreaming = false,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded || isStreaming);

  useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true);
    }
  }, [isStreaming]);

  if (!reasoning && !isStreaming) return null;

  return (
    <div
      id="collapsible-reasoning-container"
      className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden text-xs sm:text-sm"
    >
      <div
        id="reasoning-header"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 cursor-pointer hover:bg-zinc-850 select-none transition-colors border-b border-zinc-800/60"
      >
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="text-zinc-500">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
          <div className="flex items-center gap-1.5 font-medium text-indigo-300">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reasoning</span>
          </div>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full animate-pulse font-mono">
              <Sparkles className="w-2.5 h-2.5" />
              Thinking...
            </span>
          )}
          {!isStreaming && reasoning && (
            <span className="text-[11px] text-zinc-500 font-mono">
              {reasoning.length} chars
            </span>
          )}
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <CopyButton text={reasoning} title="Copy reasoning" />
        </div>
      </div>

      {isExpanded && (
        <div
          id="reasoning-body"
          className="p-3 text-zinc-400 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto bg-zinc-950/40 select-text"
        >
          {reasoning || (
            <span className="italic text-zinc-500">Analyzing query and formulating response...</span>
          )}
        </div>
      )}
    </div>
  );
};
