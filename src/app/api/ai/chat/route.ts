/**
 * POST /api/ai/chat
 *
 * Streaming chat endpoint. Proxies the conversation to Ollama and streams
 * tokens back as Server-Sent Events (SSE). Falls back to rules-based response
 * if Ollama is unavailable.
 *
 * Body: {
 *   messages: ChatMessage[],
 *   builderContext?: BuilderContextSnapshot,  // current project state
 *   stream?: boolean,                          // default true
 * }
 *
 * Response (stream=true): text/event-stream  → data: <token>\n\n
 * Response (stream=false): application/json  → { content: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ChatMessage } from '@/lib/ai/types';
import { FORGE_BUILDER_SYSTEM_PROMPT, buildContextBlock } from '@/lib/ai/system-prompt';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

interface BuilderContextSnapshot {
  projectName?: string;
  currentPage?: string;
  pageCount?: number;
  sectionCount?: number;
  sections?: Array<{ type: string; id: string }>;
  theme?: Record<string, unknown>;
}

interface ChatBody {
  messages: ChatMessage[];
  builderContext?: BuilderContextSnapshot;
  stream?: boolean;
}

async function getActiveModel(): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { models: Array<{ name: string }> };
    const PREFERRED = ['qwen2.5-coder:1.5b', 'phi3:mini', 'phi3.5:mini', 'llama3.2:3b'];
    const installed = data.models.map((m) => m.name);
    return PREFERRED.find((p) => installed.some((m) => m.startsWith(p.split(':')[0]))) ?? installed[0] ?? null;
  } catch {
    return null;
  }
}

function buildSystemContent(ctx?: BuilderContextSnapshot): string {
  // Inject learned knowledge relevant to the conversation
  let knowledge = '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ks = require('@/lib/ai/knowledge-store') as typeof import('@/lib/ai/knowledge-store');
    knowledge = ks.getKnowledgeSummary('web builder ecommerce jewellery best practice');
  } catch { /* non-critical */ }

  const contextBlock = ctx ? '\n\n' + buildContextBlock(ctx) : '';
  return FORGE_BUILDER_SYSTEM_PROMPT + contextBlock + knowledge;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatBody;
  const { messages, builderContext, stream = true } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  const model = await getActiveModel();
  const systemContent = buildSystemContent(builderContext);

  // Prepend system message if not present
  const fullMessages: Array<{ role: string; content: string }> =
    messages[0]?.role === 'system'
      ? messages.map((m) => ({ role: m.role, content: m.content }))
      : [{ role: 'system', content: systemContent }, ...messages.map((m) => ({ role: m.role, content: m.content }))];

  // ── Ollama streaming ──────────────────────────────────────────────────────
  if (model) {
    if (stream) {
      // SSE streaming response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model,
                messages: fullMessages,
                stream: true,
                options: { num_predict: 1024, temperature: 0.7 },
              }),
            });

            if (!ollamaRes.ok || !ollamaRes.body) {
              controller.enqueue(encoder.encode(`data: [ERROR] Ollama error ${ollamaRes.status}\n\n`));
              controller.close();
              return;
            }

            const reader = ollamaRes.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
              for (const line of lines) {
                try {
                  const chunk = JSON.parse(line) as { message?: { content: string }; done?: boolean };
                  if (chunk.message?.content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk.message.content)}\n\n`));
                  }
                  if (chunk.done) {
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  }
                } catch { /* skip malformed */ }
              }
            }
          } catch (e) {
            controller.enqueue(encoder.encode(`data: [ERROR] ${String(e)}\n\n`));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-AI-Provider': 'ollama',
          'X-AI-Model': model,
        },
      });
    } else {
      // Non-streaming: wait for full response
      const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: fullMessages,
          stream: false,
          options: { num_predict: 1024, temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      const data = (await ollamaRes.json()) as { message: { content: string } };
      return NextResponse.json({ content: data.message.content, provider: 'ollama', model });
    }
  }

  // ── Rules-based fallback ──────────────────────────────────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RulesBasedProvider } = require('@/lib/ai/rules-provider') as typeof import('@/lib/ai/rules-provider');
    const provider = new RulesBasedProvider();
    await provider.initialize();
    const chatMessages = messages.map((m) => ({ ...m }));
    const content = await provider.chat(chatMessages);

    if (stream) {
      const encoder = new TextEncoder();
      const words = content.split(' ');
      const readable = new ReadableStream({
        async start(controller) {
          for (const word of words) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(word + ' ')}\n\n`));
            await new Promise((r) => setTimeout(r, 10));
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-AI-Provider': 'rules-based',
        },
      });
    }

    return NextResponse.json({ content, provider: 'rules-based' });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
