/**
 * Forge Builder — WebLLM Browser Provider
 *
 * Runs a quantized LLM entirely in the browser via WebGPU (MLC framework).
 * On first use the model is downloaded once (~1.5-2.5 GB) then cached in
 * IndexedDB — subsequent runs work fully offline with zero server required.
 *
 * Requirements: Chrome 113+ / Edge 113+ with WebGPU enabled.
 * Model: Phi-3.5-mini-instruct (3.8B, q4f16, ~2.2 GB) — best offline quality/size.
 *
 * This provider is lazy: the heavy @mlc-ai/web-llm import only runs in
 * the browser and only when this provider is actually initialized.
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

// MLC model config: prefer smaller models for fast first-load
const DEFAULT_MODEL = 'Phi-3.5-mini-instruct-q4f16_1-MLC';
const FALLBACK_MODEL = 'Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC';

type WebLLMEngine = {
  reload: (model: string, config?: Record<string, unknown>) => Promise<void>;
  chat: {
    completions: {
      create: (params: {
        messages: Array<{ role: string; content: string }>;
        max_tokens?: number;
        temperature?: number;
        stream?: boolean;
      }) => Promise<{
        choices: Array<{ message: { content: string } }>;
      }>;
    };
  };
  resetChat: () => Promise<void>;
};

export class WebLLMProvider implements AIProvider {
  readonly name: AIProviderName = 'webllm';
  private _engine: WebLLMEngine | null = null;
  private _model = DEFAULT_MODEL;
  private _status: AIStatusDetail = {
    status: 'uninitialized',
    provider: 'webllm',
    model: null,
  };

  getStatus(): AIStatusDetail {
    return { ...this._status };
  }

  getDefaultModel(): ModelInfo {
    return {
      provider: 'webllm',
      modelId: this._model,
      displayName: 'Phi-3.5 Mini (local)',
      contextLength: 4096,
      offline: true,
    };
  }

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    // WebGPU availability check
    const nav = navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } };
    if (!nav.gpu) return false;
    try {
      const adapter = await nav.gpu.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  }

  async initialize(onProgress?: (pct: number) => void): Promise<void> {
    if (typeof window === 'undefined') {
      this._status = { status: 'error', provider: 'webllm', model: null, error: 'WebLLM requires a browser environment' };
      return;
    }

    this._status = { ...this._status, status: 'downloading', downloadProgress: 0 };

    try {
      // Dynamic import so Next.js SSR doesn't choke on browser-only APIs
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

      const progressCb = (report: { progress: number }) => {
        const pct = Math.round(report.progress * 100);
        this._status = {
          ...this._status,
          status: pct < 100 ? 'downloading' : 'loading',
          downloadProgress: pct,
        };
        onProgress?.(pct);
      };

      this._engine = await CreateMLCEngine(this._model, {
        initProgressCallback: progressCb,
      }) as WebLLMEngine;

      this._status = {
        status: 'ready',
        provider: 'webllm',
        model: {
          provider: 'webllm',
          modelId: this._model,
          displayName: 'Phi-3.5 Mini (local)',
          contextLength: 4096,
          offline: true,
        },
      };
    } catch (e) {
      // Try fallback model
      if (this._model !== FALLBACK_MODEL) {
        this._model = FALLBACK_MODEL;
        return this.initialize(onProgress);
      }
      this._status = {
        status: 'error',
        provider: 'webllm',
        model: null,
        error: e instanceof Error ? e.message : 'WebLLM failed to load',
      };
    }
  }

  async chat(messages: ChatMessage[], options?: GenerateOptions): Promise<string> {
    if (!this._engine) throw new Error('WebLLM not initialized');
    const formatted = messages.map((m) => ({ role: m.role as string, content: m.content }));
    const result = await this._engine.chat.completions.create({
      messages: formatted,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.7,
      stream: false,
    });
    return result.choices[0]?.message.content ?? '';
  }

  async chatStream(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    options?: GenerateOptions
  ): Promise<void> {
    if (!this._engine) throw new Error('WebLLM not initialized');
    const formatted = messages.map((m) => ({ role: m.role as string, content: m.content }));

    // Stream via AsyncIterable chunks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await (this._engine.chat.completions.create({
      messages: formatted,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.7,
      stream: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as unknown as Promise<AsyncIterable<{ choices: Array<{ delta: { content?: string } }> }>>);

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) onToken(content);
    }
  }

  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: GenerateOptions
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { id: 'sys', role: 'system', content: systemPrompt ?? FORGE_BUILDER_SYSTEM_PROMPT, timestamp: Date.now() },
      { id: 'user', role: 'user', content: prompt, timestamp: Date.now() },
    ];
    return this.chat(messages, options);
  }
}
