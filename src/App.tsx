import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatConversation,
  ChatMessage,
  ApiConfig,
  KeyExpiryInfo,
} from './types';
import {
  getStoredConfig,
  saveStoredConfig,
  getStoredChats,
  saveStoredChats,
  getStoredActiveChatId,
  saveStoredActiveChatId,
  getKeyExpiryInfo,
  clearApiKey,
  touchApiKey,
} from './utils/storage';
import { sendChatMessage } from './utils/openai';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export default function App() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [config, setConfig] = useState<ApiConfig>(getStoredConfig());
  const [keyExpiry, setKeyExpiry] = useState<KeyExpiryInfo>(getKeyExpiryInfo());
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const storedChats = getStoredChats();
    const storedActiveId = getStoredActiveChatId();

    if (storedChats.length > 0) {
      setConversations(storedChats);
      const validActiveId = storedChats.some((c) => c.id === storedActiveId)
        ? storedActiveId
        : storedChats[0].id;
      setActiveChatId(validActiveId);
    } else {
      const initialChat: ChatConversation = {
        id: generateId(),
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setConversations([initialChat]);
      setActiveChatId(initialChat.id);
      saveStoredChats([initialChat]);
      saveStoredActiveChatId(initialChat.id);
    }

    const initialConfig = getStoredConfig();
    setConfig(initialConfig);
    setKeyExpiry(getKeyExpiryInfo());

    const interval = setInterval(() => {
      const currentExpiry = getKeyExpiryInfo();
      setKeyExpiry(currentExpiry);
      if (currentExpiry.isExpired) {
        setConfig((prev) => ({ ...prev, apiKey: '' }));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const currentConversation = conversations.find((c) => c.id === activeChatId) || null;

  const handleNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }

    const newChat: ChatConversation = {
      id: generateId(),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    setConversations((prev) => {
      const updated = [newChat, ...prev];
      saveStoredChats(updated);
      return updated;
    });

    setActiveChatId(newChat.id);
    saveStoredActiveChatId(newChat.id);
    setInput('');
  }, []);

  const handleSelectChat = (id: string) => {
    if (id === activeChatId) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
    setActiveChatId(id);
    saveStoredActiveChatId(id);
  };

  const handleDeleteChat = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    saveStoredChats(remaining);

    if (activeChatId === id) {
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
        saveStoredActiveChatId(remaining[0].id);
      } else {
        const fresh: ChatConversation = {
          id: generateId(),
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        setConversations([fresh]);
        setActiveChatId(fresh.id);
        saveStoredChats([fresh]);
        saveStoredActiveChatId(fresh.id);
      }
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c
      );
      saveStoredChats(updated);
      return updated;
    });
  };

  const handleSaveConfig = (newConfig: ApiConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
    setKeyExpiry(getKeyExpiryInfo());
  };

  const handleClearKey = () => {
    clearApiKey();
    setConfig((prev) => ({ ...prev, apiKey: '' }));
    setKeyExpiry(getKeyExpiryInfo());
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isStreaming) return;

    if (!config.apiKey.trim()) {
      setIsSettingsOpen(true);
      return;
    }

    let activeId = activeChatId;
    let targetChat = currentConversation;

    if (!targetChat || !activeId) {
      const newChat: ChatConversation = {
        id: generateId(),
        title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      targetChat = newChat;
      activeId = newChat.id;
      setActiveChatId(activeId);
      setConversations((prev) => [newChat, ...prev]);
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantMessageId = generateId();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      reasoning: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const updatedMessages = [...targetChat.messages, userMessage, assistantPlaceholder];
    const isFirstMessage = targetChat.messages.length === 0;
    const newTitle = isFirstMessage
      ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
      : targetChat.title;

    const updatedConversation: ChatConversation = {
      ...targetChat,
      title: newTitle,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setConversations((prev) => {
      const next = prev.map((c) => (c.id === activeId ? updatedConversation : c));
      saveStoredChats(next);
      return next;
    });

    setInput('');
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = '';
    let accumulatedReasoning = '';

    try {
      await sendChatMessage(
        config,
        [...targetChat.messages, userMessage],
        (delta) => {
          if (delta.reasoning) {
            accumulatedReasoning += delta.reasoning;
          }
          if (delta.text) {
            accumulatedContent += delta.text;
          }

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeId) return c;
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id !== assistantMessageId) return m;
                  return {
                    ...m,
                    content: accumulatedContent,
                    reasoning: accumulatedReasoning,
                    isStreaming: true,
                  };
                }),
              };
            })
          );
        },
        abortController.signal
      );

      setConversations((prev) => {
        const next = prev.map((c) => {
          if (c.id !== activeId) return c;
          return {
            ...c,
            updatedAt: Date.now(),
            messages: c.messages.map((m) => {
              if (m.id !== assistantMessageId) return m;
              return {
                ...m,
                content: accumulatedContent,
                reasoning: accumulatedReasoning,
                isStreaming: false,
              };
            }),
          };
        });
        saveStoredChats(next);
        return next;
      });

      touchApiKey();
      setKeyExpiry(getKeyExpiryInfo());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id !== activeId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId ? { ...m, isStreaming: false } : m
              ),
            };
          });
          saveStoredChats(next);
          return next;
        });
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown communication error';
        setConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id !== activeId) return c;
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id !== assistantMessageId) return m;
                return {
                  ...m,
                  content: errorMessage,
                  error: true,
                  isStreaming: false,
                };
              }),
            };
          });
          saveStoredChats(next);
          return next;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRetryLastMessage = () => {
    if (!currentConversation || currentConversation.messages.length < 2) return;
    const msgs = currentConversation.messages;
    const lastUserMessage = [...msgs].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    const cleanedMessages = msgs.filter((m) => !(m.role === 'assistant' && m.error));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, messages: cleanedMessages } : c
      )
    );

    handleSendMessage(lastUserMessage.content);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 antialiased font-sans">
      <Sidebar
        conversations={conversations}
        activeId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        keyExpiry={keyExpiry}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <ChatArea
          conversation={currentConversation}
          config={config}
          keyExpiry={keyExpiry}
          isStreaming={isStreaming}
          input={input}
          setInput={setInput}
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          onNewChat={handleNewChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onRetryLastMessage={handleRetryLastMessage}
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        keyExpiry={keyExpiry}
        onClearKey={handleClearKey}
      />
    </div>
  );
}
