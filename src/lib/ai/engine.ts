/**
 * Forge Builder — AI Engine
 *
 * Unified AI interface that auto-detects and falls back across providers:
 *   1. Ollama (localhost:11434) — best quality, requires Ollama install
 *   2. WebLLM (browser WebGPU) — in-browser, no server, first-load ~2GB download
 *   3. Rules-Based — always works, template heuristics, zero deps
 *
 * Usage (server-side / API routes): new AIEngine()
 * Usage (client-side hook): useAI() — wraps this with React state
 */

import { OllamaProvider } from './ollama-provider';
import { WebLLMProvider } from './webllm-provider';
import { RulesBasedProvider } from './rules-provider';
import { FORGE_BUILDER_SYSTEM_PROMPT } from './system-prompt';
import type {
  AIProvider,
  AIProviderName,
  AIStatusDetail,
  ChatMessage,
  GenerateOptions,
  ModelInfo,
} from './types';

// Knowledge injection — server-side only (SQLite not available in browser)
let _getKnowledgeSummary: ((query: string) => string) | null = null;
if (typeof window === 'undefined') {
  // Dynamic require so Next.js doesn't bundle SQLite for the client
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ks = require('./knowledge-store') as typeof import('./knowledge-store');
    _getKnowledgeSummary = ks.getKnowledgeSummary;
  } catch { /* non-critical */ }
}

export type { AIProviderName, AIStatusDetail, ModelInfo };

const DETECTION_TIMEOUT_MS = 3500;

export class AIEngine {
  private _provider: AIProvider;
  private _ollama: OllamaProvider;
  private _webllm: WebLLMProvider;
  private _rules: RulesBasedProvider;
  private _initialized = false;

  constructor() {
    this._ollama = new OllamaProvider();
    this._webllm = new WebLLMProvider();
    this._rules = new RulesBasedProvider();
    this._provider = this._rules; // Start with rules until detected
  }

  /** Auto-detect best available provider and initialize it */
  async init(onProgress?: (status: AIStatusDetail) => void): Promise<AIProviderName> {
    if (this._initialized) return this._provider.name;

    onProgress?.({ status: 'detecting', provider: null, model: null });

    // 1 — Try Ollama (fast local, best quality)
    const ollamaAvail = await withTimeout(this._ollama.isAvailable(), DETECTION_TIMEOUT_MS, false);
    if (ollamaAvail) {
      try {
        await this._ollama.initialize();
        if (this._ollama.getStatus().status === 'ready') {
          this._provider = this._ollama;
          this._initialized = true;
          onProgress?.(this._ollama.getStatus());
          return 'ollama';
        }
      } catch {
        // fall through
      }
    }

    // 2 — Try WebLLM (browser WebGPU, offline after first download)
    if (typeof window !== 'undefined') {
      const webllmAvail = await withTimeout(this._webllm.isAvailable(), 2000, false);
      if (webllmAvail) {
        // Don't auto-initialize WebLLM (it downloads ~2GB) — let the user trigger it
        // Mark it as available so the UI can show "Enable local AI" button
        this._provider = this._rules;
        this._initialized = true;
        onProgress?.({ status: 'ready', provider: 'rules-based', model: this._rules.getDefaultModel() });
        // Return a signal that WebLLM is available
        return 'webllm'; // caller may want to show the "download model" prompt
      }
    }

    // 3 — Rules-based fallback
    await this._rules.initialize();
    this._provider = this._rules;
    this._initialized = true;
    onProgress?.(this._rules.getStatus());
    return 'rules-based';
  }

  /** Explicitly activate WebLLM (user-triggered, downloads model if needed) */
  async activateWebLLM(onProgress?: (pct: number) => void): Promise<boolean> {
    if (!(await this._webllm.isAvailable())) return false;
    await this._webllm.initialize(onProgress);
    if (this._webllm.getStatus().status === 'ready') {
      this._provider = this._webllm;
      return true;
    }
    return false;
  }

  getStatus(): AIStatusDetail {
    return this._provider.getStatus();
  }

  isReady(): boolean {
    return this._provider.getStatus().status === 'ready';
  }

  get providerName(): AIProviderName {
    return this._provider.name;
  }

  /**
   * Send a chat conversation and get the full response.
   * Automatically prepends the Forge Builder system prompt.
   */
  async chat(
    messages: ChatMessage[],
    options?: GenerateOptions
  ): Promise<string> {
    const withSystem = ensureSystemPrompt(messages);
    return this._provider.chat(withSystem, options);
  }

  /**
   * Streaming chat — calls onToken for each token as it arrives.
   */
  async chatStream(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    options?: GenerateOptions
  ): Promise<void> {
    const withSystem = ensureSystemPrompt(messages);
    return this._provider.chatStream(withSystem, onToken, options);
  }

  /**
   * Single-turn prompt → response. Useful for section generation.
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    return this._provider.generate(prompt, FORGE_BUILDER_SYSTEM_PROMPT, options);
  }

  /**
   * Structured generation — parse JSON from the model response.
   * Retries once if first parse fails.
   */
  async generateJSON<T>(prompt: string, options?: GenerateOptions): Promise<T | null> {
    const raw = await this.generate(
      prompt + '\n\nRespond with valid JSON only. No markdown, no explanation.',
      { ...options, temperature: 0.3 }
    );
    return extractJSON<T>(raw);
  }
}

// ── Singleton for server-side use (API routes) ──────────────────────────────
let _serverEngine: AIEngine | null = null;
export function getServerAIEngine(): AIEngine {
  if (!_serverEngine) _serverEngine = new AIEngine();
  return _serverEngine;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function ensureSystemPrompt(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length > 0 && messages[0].role === 'system') return messages;

  // Augment the base system prompt with relevant learned knowledge
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const knowledgeBlock = lastUserMsg && _getKnowledgeSummary
    ? _getKnowledgeSummary(lastUserMsg.content)
    : '';

  return [
    {
      id: 'system-prompt',
      role: 'system',
      content: FORGE_BUILDER_SYSTEM_PROMPT + knowledgeBlock,
      timestamp: Date.now(),
    },
    ...messages,
  ];
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function extractJSON<T>(text: string): T | null {
  // Try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {
    // Extract from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]) as T;
      } catch {
        // continue
      }
    }
    // Extract first {...} or [...]
    const objMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[1]) as T;
      } catch {
        // give up
      }
    }
    return null;
  }
}
