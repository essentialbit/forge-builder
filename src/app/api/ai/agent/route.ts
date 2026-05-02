/**
 * POST /api/ai/agent  (streaming SSE)
 *
 * The main agentic endpoint. Receives a conversation + builder project snapshot,
 * runs the LLM with tool-aware system prompt, and streams back an AgentResponse.
 *
 * Response format (SSE):
 *   data: {"type":"thinking","content":"..."}    — reasoning in progress
 *   data: {"type":"token","content":"..."}        — streamed text token
 *   data: {"type":"complete","response":{...}}    — final parsed AgentResponse
 *   data: {"type":"error","content":"..."}        — error
 *   data: [DONE]
 *
 * The client accumulates tokens, then on "complete" extracts actions and executes them.
 */

import { NextRequest } from 'next/server';
import { FORGE_BUILDER_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { TOOL_SCHEMAS, extractAgentResponse } from '@/lib/ai/builder-tools';
import type { ProjectSnapshot } from '@/lib/ai/builder-tools';
import type { ChatMessage } from '@/lib/ai/types';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

// Models known to follow structured output reliably
const PREFERRED_MODELS = ['qwen2.5-coder:7b', 'qwen2.5-coder:1.5b', 'phi3:mini', 'phi3.5:mini', 'llama3.2:3b'];

async function getActiveModel(): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { models: Array<{ name: string }> };
    const installed = data.models.map((m) => m.name);
    return PREFERRED_MODELS.find((p) => installed.some((m) => m.startsWith(p.split(':')[0]))) ?? installed[0] ?? null;
  } catch { return null; }
}

function buildSystemPrompt(project: ProjectSnapshot): string {
  // Compact builder state summary
  const currentPage = project.pages.find((p) => p.id === project.currentPageId) ?? project.pages[0];
  const pagesList = project.pages.map((p) =>
    `  - "${p.name}" (id:${p.id}, path:${p.path ?? '/'}, ${p.sections.length} sections)`
  ).join('\n');

  const sectionsStr = currentPage
    ? currentPage.sections.map((s, i) =>
        `  ${i + 1}. [${s.type}] id:${s.id} ${s.name ? `"${s.name}"` : ''}`
      ).join('\n')
    : '  (no sections)';

  const stateBlock = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT PROJECT STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project: "${project.name}" (id: ${project.id})
Pages (${project.pages.length} total):
${pagesList}

Active page: "${currentPage?.name ?? 'none'}" (id: ${currentPage?.id ?? 'none'})
Sections on active page (${currentPage?.sections.length ?? 0}):
${sectionsStr}

Brand theme: ${JSON.stringify(project.theme ?? {})}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  // Inject learned knowledge
  let knowledge = '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ks = require('@/lib/ai/knowledge-store') as typeof import('@/lib/ai/knowledge-store');
    knowledge = ks.getKnowledgeSummary('ecommerce jewellery web builder best practice');
  } catch { /* non-critical */ }

  return FORGE_BUILDER_SYSTEM_PROMPT + '\n\n' + TOOL_SCHEMAS + '\n\n' + stateBlock + knowledge;
}

interface AgentBody {
  messages: ChatMessage[];
  project: ProjectSnapshot;
  stream?: boolean;
}

function enc(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AgentBody;
  const { messages, project, stream = true } = body;

  if (!messages?.length || !project) {
    return new Response(JSON.stringify({ error: 'messages and project required' }), { status: 400 });
  }

  const model = await getActiveModel();
  const systemContent = buildSystemPrompt(project);

  const ollamaMessages = [
    { role: 'system', content: systemContent },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  // ── Ollama path ────────────────────────────────────────────────────────
  if (model) {
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send "thinking" indicator immediately
          controller.enqueue(enc({ type: 'thinking', content: 'Analysing your request…' }));

          const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              messages: ollamaMessages,
              stream: true,
              options: {
                num_predict: 1500,
                temperature: 0.4,   // Lower temp for more reliable JSON
                top_p: 0.9,
              },
            }),
          });

          if (!ollamaRes.ok || !ollamaRes.body) {
            controller.enqueue(enc({ type: 'error', content: `Ollama error: ${ollamaRes.status}` }));
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }

          const reader = ollamaRes.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const chunk = JSON.parse(line) as { message?: { content: string }; done?: boolean };
                if (chunk.message?.content) {
                  accumulated += chunk.message.content;
                  controller.enqueue(enc({ type: 'token', content: chunk.message.content }));
                }
              } catch { /* skip */ }
            }
          }

          // Parse the complete response
          const agentResponse = extractAgentResponse(accumulated);

          // Emit the fully parsed response for the client to execute
          controller.enqueue(enc({ type: 'complete', response: agentResponse }));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));

        } catch (e) {
          controller.enqueue(enc({ type: 'error', content: String(e) }));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-AI-Model': model,
        'X-AI-Provider': 'ollama',
      },
    });
  }

  // ── Rules-based fallback ────────────────────────────────────────────────
  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(enc({ type: 'thinking', content: 'Processing…' }));

      const lastMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { RulesBasedProvider } = require('@/lib/ai/rules-provider') as typeof import('@/lib/ai/rules-provider');
      const provider = new RulesBasedProvider();
      await provider.initialize();
      const content = await provider.chat(messages);

      controller.enqueue(enc({ type: 'token', content }));
      controller.enqueue(enc({
        type: 'complete',
        response: {
          message: content,
          actions: [],
          thoughts: `Rules-based response to: ${lastMsg.slice(0, 50)}`,
        },
      }));
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-AI-Provider': 'rules-based' },
  });
}
