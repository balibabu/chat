import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Shield,
  ShieldAlert,
  Search,
  Check,
  Edit2,
  X,
  Sparkles,
} from 'lucide-react';
import { ChatConversation, KeyExpiryInfo } from '../types';

interface SidebarProps {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  keyExpiry: KeyExpiryInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onOpenSettings,
  keyExpiry,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEditing = (e: React.MouseEvent, chat: ChatConversation) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitleText(chat.title);
  };

  const saveEditing = (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation();
    if (editTitleText.trim()) {
      onRenameChat(id, editTitleText.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">OpenAI Chat</h1>
              <p className="text-[11px] text-zinc-500">Universal Client</p>
            </div>
          </div>
          <button
            type="button"
            id="close-sidebar-btn"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-2">
          <button
            type="button"
            id="sidebar-new-chat-btn"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {conversations.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                id="search-chats-input"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 px-4 text-zinc-600 text-xs">
              {searchTerm ? 'No matching chats' : 'No chats yet. Start a new one!'}
            </div>
          ) : (
            filtered.map((chat) => {
              const isActive = chat.id === activeId;
              const isEditing = chat.id === editingId;

              return (
                <div
                  key={chat.id}
                  id={`chat-item-${chat.id}`}
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                  className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer select-none transition-all ${
                    isActive
                      ? 'bg-zinc-850 text-zinc-100 font-medium border border-zinc-700/60 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />

                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitleText}
                        onChange={(e) => setEditTitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing(e, chat.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="flex-1 bg-zinc-900 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-zinc-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => saveEditing(e, chat.id)}
                        className="p-1 hover:text-emerald-400 text-zinc-400"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="flex-1 truncate">{chat.title || 'Untitled Chat'}</span>
                  )}

                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        type="button"
                        id={`rename-chat-${chat.id}`}
                        onClick={(e) => startEditing(e, chat)}
                        title="Rename chat"
                        className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        id={`delete-chat-${chat.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        title="Delete chat"
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 space-y-2">
          <div
            id="key-expiry-status"
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-colors text-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                {keyExpiry.hasKey ? (
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>API Key</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                keyExpiry.hasKey ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
              }`}>
                {keyExpiry.hasKey ? 'Active' : 'Missing'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-tight">
              {keyExpiry.hasKey
                ? `Deletes in ${keyExpiry.daysRemaining ?? 7}d if unused`
                : 'Configure API key in settings'}
            </p>
          </div>

          <button
            type="button"
            id="sidebar-settings-btn"
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Settings & API</span>
            </div>
            <span className="text-[10px] text-zinc-600 font-mono">Config</span>
          </button>
        </div>
      </aside>
    </>
  );
};
