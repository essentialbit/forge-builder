/**
 * Forge Builder — Ollama Provider
 *
 * Connects to a locally-running Ollama instance (https://ollama.com).
 * Defaults to phi3:mini (3.8B, fast, excellent for structured tasks).
 * Falls back to llama3.2:3b or any other installed model.
 *
 * Ollama must be installed separately: `brew install ollama && ollama pull phi3:mini`
 * API: http://localhost:11434
 */

import type {
  AIProvider,
  AIProviderName,
  AIStatusDetail,
  ChatMessage,
  GenerateOptions,
  ModelInfo,
} from './types';
import { FORGE_BUILDER_SYSTEM_PROMPT } from './system-prompt';

const OLLAMA_BASE = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

// Preference order for model selection
const PREFERRED_MODELS = [
  'qwen2.5-coder:1.5b',  // Best for code + structured output, tiny
  'phi3:mini',            // Microsoft Phi-3, excellent reasoning, small
  'phi3.5:mini',
  'llama3.2:3b',
  'mistral:7b',
  'llama3:8b',
  'gemma2:9b',
];

let _cachedModel: string | null = null;

async function detectBestModel(): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { models: Array<{ name: string }> };
    const installed = data.models.map((m) => m.name);
    for (const preferred of PREFERRED_MODELS) {
      const match = installed.find(
        (m) => m === preferred || m.startsWith(preferred.split(':')[0] + ':')
      );
      if (match) return match;
    }
    // Use whatever is first installed
    return installed[0] ?? null;
  } catch {
    return null;
  }
}

export class OllamaProvider implements AIProvider {
  readonly name: AIProviderName = 'ollama';
  private _status: AIStatusDetail = {
    status: 'uninitialized',
    provider: 'ollama',
    model: null,
  };
  private _model: string = 'phi3:mini';

  getStatus(): AIStatusDetail {
    return { ...this._status };
  }

  getDefaultModel(): ModelInfo {
    return {
      provider: 'ollama',
      modelId: this._model,
      displayName: this._model,
      contextLength: 4096,
      offline: true,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
        signal: AbortSignal.timeout(2500),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async initialize(_onProgress?: (pct: number) => void): Promise<void> {
    this._status = { ...this._status, status: 'loading' };
    const model = await detectBestModel();
    if (!model) {
      this._status = {
        status: 'error',
        provider: 'ollama',
        model: null,
        error: 'No Ollama models found. Run: ollama pull phi3:mini',
      };
      return;
    }
    _cachedModel = model;
    this._model = model;
    this._status = {
      status: 'ready',
      provider: 'ollama',
      model: {
        provider: 'ollama',
        modelId: model,
        displayName: model,
        contextLength: 4096,
        offline: true,
      },
    };
  }

  async chat(messages: ChatMessage[], options?: GenerateOptions): Promise<string> {
    const ollamaMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this._model,
        messages: ollamaMessages,
        stream: false,
        options: {
          num_predict: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7,
        },
      }),
      signal: options?.signal,
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
    const data = (await res.json()) as { message: { content: string } };
    return data.message.content;
  }

  async chatStream(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    options?: GenerateOptions
  ): Promise<void> {
    const ollamaMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this._model,
        messages: ollamaMessages,
        stream: true,
        options: {
          num_predict: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7,
        },
      }),
      signal: options?.signal,
    });

    if (!res.ok || !res.body) throw new Error(`Ollama stream error: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const chunk = JSON.parse(line) as { message?: { content: string }; done?: boolean };
          if (chunk.message?.content) onToken(chunk.message.content);
        } catch {
          // skip malformed chunk
        }
      }
    }
  }

  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: GenerateOptions
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        id: 'sys',
        role: 'system',
        content: systemPrompt ?? FORGE_BUILDER_SYSTEM_PROMPT,
        timestamp: Date.now(),
      },
      {
        id: 'user',
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
      },
    ];
    return this.chat(messages, options);
  }
}
