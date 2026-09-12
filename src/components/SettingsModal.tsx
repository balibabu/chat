import React, { useState, useEffect, useCallback } from 'react';
import { X, Eye, EyeOff, Shield, Trash2, Check, Sparkles, RefreshCw } from 'lucide-react';
import { ApiConfig, KeyExpiryInfo } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onSaveConfig: (config: ApiConfig) => void;
  keyExpiry: KeyExpiryInfo;
  onClearKey: () => void;
}

const PRESET_ENDPOINTS = [
  { name: 'OpenAI', url: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1', defaultModel: 'deepseek/deepseek-r1' },
  { name: 'Groq', url: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  { name: 'DeepSeek', url: 'https://api.deepseek.com', defaultModel: 'deepseek-reasoner' },
  { name: 'Ollama (Local)', url: 'http://localhost:11434/v1', defaultModel: 'deepseek-r1:latest' },
  { name: 'LM Studio', url: 'http://localhost:1234/v1', defaultModel: 'local-model' },
];

interface ModelsState {
  status: 'idle' | 'loading' | 'success' | 'error';
  models: string[];
}

function modelsEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  const withoutChat = trimmed.replace(/\/chat\/completions$/, '');
  return `${withoutChat}/models`;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  keyExpiry,
  onClearKey,
}) => {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt || '');
  const [temperature, setTemperature] = useState(config.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens ?? 4096);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [modelsState, setModelsState] = useState<ModelsState>({ status: 'idle', models: [] });

  const fetchModels = useCallback(async (url: string, key: string) => {
    if (!url.trim()) return;
    setModelsState({ status: 'loading', models: [] });
    try {
      const headers: Record<string, string> = {};
      if (key.trim()) {
        headers['Authorization'] = `Bearer ${key.trim()}`;
      }
      const response = await fetch(modelsEndpoint(url), { headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      const models: string[] = Array.isArray(json?.data)
        ? json.data
            .map((m: { id?: unknown }) => (typeof m?.id === 'string' ? m.id : null))
            .filter((id: string | null): id is string => id !== null)
        : [];
      models.sort((a, b) => a.localeCompare(b));
      setModelsState({ status: 'success', models });
    } catch {
      setModelsState({ status: 'error', models: [] });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchModels(baseUrl, apiKey);
    }, 600);
    return () => clearTimeout(timer);
  }, [isOpen, baseUrl, apiKey, fetchModels]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim() || 'gpt-4o',
      systemPrompt: systemPrompt.trim(),
      temperature: Number(temperature),
      maxTokens: Number(maxTokens),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const applyPreset = (preset: { name: string; url: string; defaultModel: string }) => {
    setBaseUrl(preset.url);
    setModel(preset.defaultModel);
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
    >
      <div
        id="settings-modal-card"
        className="w-full max-w-xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">API Configuration</h2>
              <p className="text-xs text-zinc-400">OpenAI compatible endpoints & models</p>
            </div>
          </div>
          <button
            type="button"
            id="close-settings-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Provider Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ENDPOINTS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  id={`preset-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => applyPreset(preset)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    baseUrl === preset.url
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium'
                      : 'bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              OpenAI Compatible URL
            </label>
            <input
              type="text"
              id="base-url-input"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              required
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-[11px] text-zinc-500">
              Supports any OpenAI-compatible format. Trailing <code className="text-zinc-400">/chat/completions</code> will be handled automatically.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">
                API Token / Key
              </label>
              {keyExpiry.hasKey && (
                <button
                  type="button"
                  id="clear-api-key-btn"
                  onClick={() => {
                    onClearKey();
                    setApiKey('');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Key
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                id="api-key-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full pl-3.5 pr-10 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                id="toggle-show-key-btn"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-2 p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-start gap-2.5 text-xs text-zinc-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-zinc-300 font-medium">Local Storage & Inactivity Expiry</p>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Your token is stored exclusively in your local browser storage. For security, it is automatically purged if you do not use the app for 7 consecutive days.
                </p>
                {keyExpiry.hasKey && keyExpiry.daysRemaining !== null && (
                  <p className="text-[11px] text-emerald-400/90 font-mono pt-1">
                    Status: Active • Auto-deletion in ~{keyExpiry.daysRemaining} days of inactivity
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300">
                Model Name
              </label>
              <button
                type="button"
                id="refresh-models-btn"
                onClick={() => fetchModels(baseUrl, apiKey)}
                disabled={modelsState.status === 'loading' || !baseUrl.trim()}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:hover:text-indigo-400 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${modelsState.status === 'loading' ? 'animate-spin' : ''}`} />
                Refresh models
              </button>
            </div>
            <input
              type="text"
              id="model-name-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o"
              required
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
            {modelsState.status === 'loading' && (
              <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-0.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Fetching models from endpoint…
              </p>
            )}
            {modelsState.status === 'error' && (
              <p className="text-[11px] text-amber-500/80 pt-0.5">
                Couldn't fetch the model list — check the URL/key and use manual entry.
              </p>
            )}
            {modelsState.status === 'success' && modelsState.models.length === 0 && (
              <p className="text-[11px] text-zinc-500 pt-0.5">
                Endpoint returned no models.
              </p>
            )}
            {modelsState.status === 'success' && modelsState.models.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto">
                {modelsState.models.map((m) => (
                  <button
                    type="button"
                    key={m}
                    id={`model-chip-${m.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                    onClick={() => setModel(m)}
                    className={`px-2 py-0.5 text-[11px] rounded-md border font-mono transition-colors ${
                      model === m
                        ? 'bg-indigo-600/30 border-indigo-500/80 text-indigo-200'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              System Prompt (Optional)
            </label>
            <textarea
              id="system-prompt-input"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful, concise AI assistant."
              rows={2}
              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-300">Temperature</span>
                <span className="font-mono text-zinc-400">{temperature}</span>
              </div>
              <input
                type="range"
                id="temperature-slider"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-300">Max Tokens</span>
                <span className="font-mono text-zinc-400">{maxTokens}</span>
              </div>
              <input
                type="number"
                id="max-tokens-input"
                min="128"
                max="65536"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 4096)}
                className="w-full px-2.5 py-1 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/80">
          <button
            type="button"
            id="cancel-settings-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="save-settings-btn"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Configuration</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
