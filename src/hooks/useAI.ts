/**
 * Forge Builder — useAI React Hook
 *
 * Manages the AI assistant state: status, chat history, streaming tokens,
 * SAST/drift analysis results, and suggestions. Communicates with the
 * server-side API routes so all LLM calls stay off the main thread.
 *
 * Design principles:
 * - Never blocks UI: all AI calls are async/non-blocking
 * - Resilient: errors are caught and surfaced gracefully
 * - Context-aware: automatically includes current builder state
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, SASTFinding, DriftFinding, AutoSuggestion } from '@/lib/ai/types';

export interface AIStatusInfo {
  provider: 'ollama' | 'webllm' | 'rules-based' | null;
  ollamaAvailable: boolean;
  activeModel: string | null;
  knowledgeCount: number;
  lastLearnedAt: number | null;
  features: {
    chat: boolean;
    generate: boolean;
    analyze: boolean;
    sast: boolean;
    drift: boolean;
    autoSuggest: boolean;
    selfLearn: boolean;
  };
}

export interface AnalysisState {
  score: number;
  summary: string;
  sast: SASTFinding[];
  drift: DriftFinding[];
  suggestions: AutoSuggestion[];
  analyzedAt: number | null;
  isAnalyzing: boolean;
}

interface BuilderContext {
  projectName?: string;
  currentPage?: string;
  pageCount?: number;
  sectionCount?: number;
  sections?: Array<{ type: string; id: string }>;
  theme?: Record<string, unknown>;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function useAI(builderContext?: BuilderContext) {
  const [status, setStatus] = useState<AIStatusInfo | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const [analysis, setAnalysis] = useState<AnalysisState>({
    score: 100,
    summary: '',
    sast: [],
    drift: [],
    suggestions: [],
    analyzedAt: null,
    isAnalyzing: false,
  });

  const [isLearning, setIsLearning] = useState(false);
  const [lastLearnResult, setLastLearnResult] = useState<{
    totalItemsLearned: number;
    online: boolean;
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch AI status on mount ────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/ai/status');
        if (!cancelled && res.ok) {
          const data = (await res.json()) as AIStatusInfo;
          setStatus(data);
        }
      } catch { /* non-critical */ }
      finally { if (!cancelled) setStatusLoading(false); }
    })();

    // Trigger background learning on mount (non-blocking)
    fetch('/api/ai/learn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then((r) => r.json())
      .then((d: { totalItemsLearned: number; online: boolean }) => {
        if (!cancelled) setLastLearnResult(d);
      })
      .catch(() => { /* offline — silent */ });

    return () => { cancelled = true; };
  }, []);

  // ── Chat ────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);
    setStreamingContent('');

    // Abort any previous generation
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = genId();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp })),
          builderContext,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const payload = line.slice(6); // strip "data: "
          if (payload === '[DONE]') break;
          if (payload.startsWith('[ERROR]')) {
            accumulated += `\n\n⚠️ ${payload.slice(7)}`;
            break;
          }
          try {
            accumulated += JSON.parse(payload) as string;
            setStreamingContent(accumulated);
          } catch { /* skip */ }
        }
      }

      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: accumulated,
        timestamp: Date.now(),
        provider: res.headers.get('X-AI-Provider') as ChatMessage['provider'] ?? 'rules-based',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      const errMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: `Sorry, something went wrong. ${(e as Error).message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setStreamingContent('');
      setIsGenerating(false);
    }
  }, [messages, isGenerating, builderContext]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setStreamingContent('');
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
  }, []);

  // ── Analysis ────────────────────────────────────────────────────────────

  const runAnalysis = useCallback(async (project: unknown) => {
    if (analysis.isAnalyzing || !project) return;
    setAnalysis((prev) => ({ ...prev, isAnalyzing: true }));
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        score: number;
        summary: string;
        sast: SASTFinding[];
        drift: DriftFinding[];
        suggestions: AutoSuggestion[];
        analyzedAt: number;
      };
      setAnalysis({
        score: data.score,
        summary: data.summary,
        sast: data.sast ?? [],
        drift: data.drift ?? [],
        suggestions: data.suggestions ?? [],
        analyzedAt: data.analyzedAt,
        isAnalyzing: false,
      });
    } catch {
      setAnalysis((prev) => ({ ...prev, isAnalyzing: false }));
    }
  }, [analysis.isAnalyzing]);

  // ── Generate section content ──────────────────────────────────────────

  const generateSection = useCallback(async (
    sectionType: string,
    prompt: string,
    currentSettings?: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> => {
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionType, prompt, currentSettings }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { settings: Record<string, unknown> };
      return data.settings ?? null;
    } catch {
      return null;
    }
  }, []);

  // ── Self-learning ─────────────────────────────────────────────────────

  const triggerLearning = useCallback(async (force = false) => {
    if (isLearning) return;
    setIsLearning(true);
    try {
      const res = await fetch('/api/ai/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = (await res.json()) as { totalItemsLearned: number; online: boolean };
      setLastLearnResult(data);
      // Refresh status after learning
      const statusRes = await fetch('/api/ai/status');
      if (statusRes.ok) setStatus(await statusRes.json() as AIStatusInfo);
    } catch { /* non-critical */ }
    finally { setIsLearning(false); }
  }, [isLearning]);

  return {
    // Status
    status,
    statusLoading,
    // Chat
    messages,
    isGenerating,
    streamingContent,
    sendMessage,
    stopGeneration,
    clearChat,
    // Analysis
    analysis,
    runAnalysis,
    // Generation
    generateSection,
    // Learning
    isLearning,
    lastLearnResult,
    triggerLearning,
  };
}
