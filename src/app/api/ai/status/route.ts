/**
 * GET /api/ai/status
 *
 * Returns the current AI engine status: which provider is active,
 * the loaded model, and how many knowledge items are stored.
 * Also checks whether Ollama is reachable.
 */

import { NextResponse } from 'next/server';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

export async function GET() {
  // Check Ollama availability (fast, 2s timeout)
  let ollamaAvailable = false;
  let ollamaModels: string[] = [];
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      ollamaAvailable = true;
      const data = (await res.json()) as { models: Array<{ name: string }> };
      ollamaModels = data.models.map((m) => m.name);
    }
  } catch { /* offline */ }

  // Knowledge base stats
  let knowledgeCount = 0;
  let lastLearnedAt: number | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ks = require('@/lib/ai/knowledge-store') as typeof import('@/lib/ai/knowledge-store');
    const log = ks.getLearnLog(1);
    knowledgeCount = ks.getTopKnowledge(1000).length;
    lastLearnedAt = log[0]?.fetched_at ?? null;
  } catch { /* non-critical */ }

  // Recommended model
  const PREFERRED = ['qwen2.5-coder:1.5b', 'phi3:mini', 'phi3.5:mini', 'llama3.2:3b'];
  const activeModel = ollamaAvailable
    ? (PREFERRED.find((p) => ollamaModels.some((m) => m.startsWith(p.split(':')[0]))) ?? ollamaModels[0] ?? null)
    : null;

  return NextResponse.json({
    provider: ollamaAvailable ? 'ollama' : 'rules-based',
    ollamaAvailable,
    ollamaModels,
    activeModel,
    webllmAvailable: false, // Client-side detection only — reported by browser
    knowledgeCount,
    lastLearnedAt,
    features: {
      chat: true,
      generate: true,
      analyze: true,
      sast: true,
      drift: true,
      autoSuggest: true,
      selfLearn: ollamaAvailable,
    },
  });
}
