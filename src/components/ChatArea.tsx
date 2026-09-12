import React, { useRef, useEffect } from 'react';
import {
  Menu,
  Plus,
  Settings,
  Send,
  Square,
  Key,
  Brain,
  Sparkles,
  ArrowDown,
} from 'lucide-react';
import { ApiConfig, ChatConversation, KeyExpiryInfo } from '../types';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatAreaProps {
  conversation: ChatConversation | null;
  config: ApiConfig;
  keyExpiry: KeyExpiryInfo;
  isStreaming: boolean;
  input: string;
  setInput: (value: string) => void;
  onSendMessage: (text?: string) => void;
  onStopStreaming: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  onRetryLastMessage: () => void;
}

const SAMPLE_PROMPTS = [
  'Explain how quantum computers work using an everyday analogy.',
  'Write a Python script to monitor a folder and organize incoming files.',
  'Solve this logic puzzle step-by-step with your reasoning visible: Three boxes are labeled incorrectly...',
  'Compare the architectural differences between Transformer and Mamba models.',
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  config,
  keyExpiry,
  isStreaming,
  input,
  setInput,
  onSendMessage,
  onStopStreaming,
  onNewChat,
  onOpenSettings,
  onToggleSidebar,
  onRetryLastMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBottom, setShowScrollBottom] = React.useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(isStreaming ? 'auto' : 'smooth');
  }, [conversation?.messages, isStreaming]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isFarFromBottom);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSendMessage();
      }
    }
  };

  const messages = conversation?.messages || [];

  return (
    <div id="chat-main-area" className="flex-1 flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      <header
        id="chat-header"
        className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md z-20"
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="mobile-sidebar-toggle"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="model-badge-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="max-w-[140px] sm:max-w-xs truncate">{config.model}</span>
            </button>
            <span className="hidden sm:inline-block text-[11px] text-zinc-600 font-mono">
              {config.baseUrl.replace(/^https?:\/\//, '').replace(/\/v1.*$/, '')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="header-new-chat-btn"
            onClick={onNewChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 border border-zinc-800/60 transition-colors"
            title="Start new chat"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          <button
            type="button"
            id="header-settings-btn"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
            title="API Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        id="messages-scroll-viewport"
        className="flex-1 overflow-y-auto p-4 sm:p-6"
      >
        <div className="max-w-3xl mx-auto">
          {!keyExpiry.hasKey && (
            <div
              id="missing-key-banner"
              className="mb-6 p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  No API key configured. Please enter your API token to start chatting.
                </span>
              </div>
              <button
                type="button"
                id="configure-key-btn"
                onClick={onOpenSettings}
                className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/30 rounded-lg text-amber-300 font-medium transition-colors shrink-0 text-center"
              >
                Configure Key
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            <div id="empty-chat-hero" className="py-12 sm:py-16 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
                  OpenAI Compatible Chat
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Connect any OpenAI-compatible provider with live collapsible reasoning, markdown rendering, and local persistence.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 font-mono">
                <span className="flex items-center gap-1 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
                  <Brain className="w-3 h-3 text-indigo-400" />
                  Collapsible Reasoning
                </span>
                <span className="bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
                  7-Day Key Expiry
                </span>
              </div>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-2xl mx-auto">
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    id={`sample-prompt-${idx}`}
                    onClick={() => {
                      setInput(prompt);
                      onSendMessage(prompt);
                    }}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850 text-xs text-zinc-300 transition-all leading-relaxed text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {messages.map((m, index) => (
                <ChatMessageItem
                  key={m.id}
                  message={m}
                  onRetry={
                    index === messages.length - 1 && m.role === 'assistant' && m.error
                      ? onRetryLastMessage
                      : undefined
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {showScrollBottom && (
        <button
          type="button"
          id="scroll-to-bottom-btn"
          onClick={() => scrollToBottom('smooth')}
          className="absolute right-6 bottom-24 p-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white shadow-lg transition-transform hover:scale-105 z-20"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      <div id="chat-input-container" className="p-3 sm:p-4 bg-zinc-950/90 border-t border-zinc-800/80">
        <div className="max-w-3xl mx-auto relative">
          <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 focus-within:border-zinc-700 transition-colors shadow-sm">
            <textarea
              ref={textareaRef}
              id="message-input-textarea"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything (Shift+Enter for newline)..."
              disabled={isStreaming}
              className="flex-1 max-h-48 resize-none bg-transparent px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none leading-relaxed"
            />

            {isStreaming ? (
              <button
                type="button"
                id="stop-streaming-btn"
                onClick={onStopStreaming}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 hover:text-rose-300 transition-colors shrink-0"
                title="Stop response"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                id="send-message-btn"
                onClick={() => onSendMessage()}
                disabled={!input.trim()}
                className={`p-2 rounded-xl shrink-0 transition-colors ${
                  input.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] text-zinc-600">
            <span>Model: <code className="text-zinc-400 font-mono">{config.model}</code></span>
            <span>Keys deleted automatically if unused for 7 days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
