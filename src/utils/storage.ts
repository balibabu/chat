import { ApiConfig, ChatConversation, KeyExpiryInfo } from '../types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const STORAGE_KEYS = {
  API_KEY: 'chat_openai_key',
  API_KEY_LAST_USED: 'chat_openai_key_last_used',
  CONFIG: 'chat_app_config',
  CHATS: 'chat_conversations',
  ACTIVE_CHAT: 'chat_active_conversation_id',
};

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
  systemPrompt: '',
  temperature: 0.7,
  maxTokens: 4096,
};

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  const key = localStorage.getItem(STORAGE_KEYS.API_KEY);
  const lastUsedRaw = localStorage.getItem(STORAGE_KEYS.API_KEY_LAST_USED);
  if (!key) return '';

  if (!lastUsedRaw) {
    localStorage.setItem(STORAGE_KEYS.API_KEY_LAST_USED, Date.now().toString());
    return key;
  }

  const lastUsed = Number(lastUsedRaw);
  if (isNaN(lastUsed) || Date.now() - lastUsed > SEVEN_DAYS_MS) {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.removeItem(STORAGE_KEYS.API_KEY_LAST_USED);
    return '';
  }

  return key;
}

export function saveApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.removeItem(STORAGE_KEYS.API_KEY_LAST_USED);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  localStorage.setItem(STORAGE_KEYS.API_KEY_LAST_USED, Date.now().toString());
}

export function touchApiKey(): void {
  if (typeof window === 'undefined') return;
  const key = localStorage.getItem(STORAGE_KEYS.API_KEY);
  if (key) {
    localStorage.setItem(STORAGE_KEYS.API_KEY_LAST_USED, Date.now().toString());
  }
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
  localStorage.removeItem(STORAGE_KEYS.API_KEY_LAST_USED);
}

export function getKeyExpiryInfo(): KeyExpiryInfo {
  if (typeof window === 'undefined') {
    return { hasKey: false, lastUsed: null, daysRemaining: null, isExpired: false };
  }

  const key = localStorage.getItem(STORAGE_KEYS.API_KEY);
  const lastUsedRaw = localStorage.getItem(STORAGE_KEYS.API_KEY_LAST_USED);

  if (!key) {
    return { hasKey: false, lastUsed: null, daysRemaining: null, isExpired: false };
  }

  const lastUsed = Number(lastUsedRaw);
  if (!lastUsedRaw || isNaN(lastUsed)) {
    return { hasKey: true, lastUsed: Date.now(), daysRemaining: 7, isExpired: false };
  }

  const elapsed = Date.now() - lastUsed;
  if (elapsed > SEVEN_DAYS_MS) {
    return { hasKey: false, lastUsed, daysRemaining: 0, isExpired: true };
  }

  const msRemaining = SEVEN_DAYS_MS - elapsed;
  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  return {
    hasKey: true,
    lastUsed,
    daysRemaining,
    isExpired: false,
  };
}

export function getStoredConfig(): ApiConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
  const apiKey = getStoredApiKey();
  if (!raw) {
    return { ...DEFAULT_CONFIG, apiKey };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      baseUrl: parsed.baseUrl || DEFAULT_CONFIG.baseUrl,
      apiKey: apiKey,
      model: parsed.model || DEFAULT_CONFIG.model,
      systemPrompt: parsed.systemPrompt ?? DEFAULT_CONFIG.systemPrompt,
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : DEFAULT_CONFIG.temperature,
      maxTokens: typeof parsed.maxTokens === 'number' ? parsed.maxTokens : DEFAULT_CONFIG.maxTokens,
    };
  } catch {
    return { ...DEFAULT_CONFIG, apiKey };
  }
}

export function saveStoredConfig(config: ApiConfig): void {
  if (typeof window === 'undefined') return;
  saveApiKey(config.apiKey);
  const toSave = {
    baseUrl: config.baseUrl,
    model: config.model,
    systemPrompt: config.systemPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(toSave));
}

export function getStoredChats(): ChatConversation[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredChats(chats: ChatConversation[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
}

export function getStoredActiveChatId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT);
}

export function saveStoredActiveChatId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (!id) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT, id);
  }
}
