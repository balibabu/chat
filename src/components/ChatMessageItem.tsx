import React from 'react';
import { Bot, User, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types';
import { ReasoningBlock } from './ReasoningBlock';
import { MarkdownContent } from './MarkdownContent';
import { CopyButton } from './CopyButton';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onRetry,
}) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div
        id={`chat-message-${message.id}`}
        className="flex justify-end mb-5 group"
      >
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300">
            <User className="w-4 h-4" />
          </div>

          <div className="flex flex-col items-end">
            <div className="bg-zinc-800 text-zinc-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm sm:text-base border border-zinc-700/60 shadow-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500 px-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <CopyButton text={message.content} title="Copy your message" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`chat-message-${message.id}`}
      className="flex justify-start mb-6 group"
    >
      <div className="flex items-start gap-3 w-full max-w-full">
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-300 mt-0.5">
          <Bot className="w-4 h-4 text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          {message.reasoning && (
            <ReasoningBlock
              reasoning={message.reasoning}
              isStreaming={message.isStreaming}
              defaultExpanded={false}
            />
          )}

          {message.content ? (
            <div className="bg-zinc-900/40 rounded-2xl rounded-tl-sm px-4 py-3 border border-zinc-800/80">
              <MarkdownContent content={message.content} />
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle" />
              )}
            </div>
          ) : message.isStreaming ? (
            <div className="flex items-center gap-2 text-zinc-400 text-sm py-2 px-3 bg-zinc-900/30 rounded-lg border border-zinc-800">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Generating response...</span>
            </div>
          ) : null}

          {message.error && (
            <div className="mt-2 flex items-center justify-between gap-3 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-200 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{message.content || 'An error occurred while communicating with the API.'}</span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  id="retry-message-btn"
                  onClick={onRetry}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-900/60 hover:bg-rose-900 text-rose-100 rounded text-xs transition-colors shrink-0 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              )}
            </div>
          )}

          {!message.isStreaming && message.content && (
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-500 px-1">
              <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="flex items-center gap-1">
                <CopyButton text={message.content} title="Copy response" />
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  id="copy-text-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      (message.reasoning ? `[Reasoning]\n${message.reasoning}\n\n[Answer]\n` : '') + message.content
                    );
                  }}
                  className="text-zinc-500 hover:text-zinc-300 text-[11px] px-1 py-0.5 rounded hover:bg-zinc-800/60 transition-colors"
                >
                  Copy All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
