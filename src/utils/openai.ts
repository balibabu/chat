import { ApiConfig, ChatMessage } from '../types';
import { touchApiKey } from './storage';

export function normalizeEndpoint(baseUrl: string): string {
  let url = baseUrl.trim();
  if (!url) {
    url = 'https://api.openai.com/v1';
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (url.endsWith('/chat/completions')) {
    return url;
  }
  return `${url}/chat/completions`;
}

export async function sendChatMessage(
  config: ApiConfig,
  messages: ChatMessage[],
  onDelta: (delta: { text?: string; reasoning?: string }) => void,
  signal?: AbortSignal
): Promise<{ content: string; reasoning: string }> {
  touchApiKey();

  const endpoint = normalizeEndpoint(config.baseUrl);

  const formattedMessages: { role: string; content: string }[] = [];

  if (config.systemPrompt && config.systemPrompt.trim()) {
    formattedMessages.push({
      role: 'system',
      content: config.systemPrompt.trim(),
    });
  }

  for (const m of messages) {
    if (m.role === 'user' || m.role === 'assistant' || m.role === 'system') {
      formattedMessages.push({
        role: m.role,
        content: m.content,
      });
    }
  }

  const payload: Record<string, unknown> = {
    model: config.model.trim() || 'gpt-4o',
    messages: formattedMessages,
    stream: true,
  };

  if (typeof config.temperature === 'number') {
    payload.temperature = config.temperature;
  }
  if (typeof config.maxTokens === 'number' && config.maxTokens > 0) {
    payload.max_tokens = config.maxTokens;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey && config.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      try {
        errorDetail = await response.text();
      } catch {
        errorDetail = response.statusText;
      }
    }
    throw new Error(`API Error (${response.status}): ${errorDetail || response.statusText}`);
  }

  let fullContent = '';
  let fullReasoning = '';

  if (!response.body) {
    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    let text = message?.content || '';
    let reasoning = message?.reasoning_content || message?.reasoning || '';

    if (text.includes('<think>')) {
      const parts = text.split('</think>');
      if (parts.length > 1) {
        reasoning = (reasoning ? reasoning + '\n' : '') + parts[0].replace('<think>', '').trim();
        text = parts.slice(1).join('</think>').trim();
      }
    }

    if (reasoning) {
      onDelta({ reasoning });
    }
    if (text) {
      onDelta({ text });
    }
    return { content: text, reasoning };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let insideThinkTag = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith(':')) continue;

      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') {
          break;
        }

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          const deltaReasoning = delta.reasoning_content || delta.reasoning;
          if (deltaReasoning) {
            fullReasoning += deltaReasoning;
            onDelta({ reasoning: deltaReasoning });
          }

          let deltaContent = delta.content;
          if (deltaContent) {
            if (!insideThinkTag && deltaContent.includes('<think>')) {
              insideThinkTag = true;
              const [before, after] = deltaContent.split('<think>');
              if (before) {
                fullContent += before;
                onDelta({ text: before });
              }
              if (after) {
                if (after.includes('</think>')) {
                  insideThinkTag = false;
                  const [thinkContent, rest] = after.split('</think>');
                  fullReasoning += thinkContent;
                  onDelta({ reasoning: thinkContent });
                  if (rest) {
                    fullContent += rest;
                    onDelta({ text: rest });
                  }
                } else {
                  fullReasoning += after;
                  onDelta({ reasoning: after });
                }
              }
            } else if (insideThinkTag) {
              if (deltaContent.includes('</think>')) {
                insideThinkTag = false;
                const [thinkContent, rest] = deltaContent.split('</think>');
                if (thinkContent) {
                  fullReasoning += thinkContent;
                  onDelta({ reasoning: thinkContent });
                }
                if (rest) {
                  fullContent += rest;
                  onDelta({ text: rest });
                }
              } else {
                fullReasoning += deltaContent;
                onDelta({ reasoning: deltaContent });
              }
            } else {
              fullContent += deltaContent;
              onDelta({ text: deltaContent });
            }
          }
        } catch {
          continue;
        }
      }
    }
  }

  return {
    content: fullContent,
    reasoning: fullReasoning,
  };
}
