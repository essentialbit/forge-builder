/**
 * POST /api/ai/search
 *
 * Web search endpoint for the AI agent. Uses DuckDuckGo HTML (no API key),
 * fetches the top result pages, strips HTML, and summarises with Ollama.
 *
 * Used when the agent calls the search_web tool.
 *
 * Body: { query: string }
 * Response: { summary: string, sources: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { FORGE_BUILDER_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const FETCH_TIMEOUT = 8000;
const MAX_CONTENT = 6000;

// ── DuckDuckGo HTML search ─────────────────────────────────────────────────

async function ddgSearch(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ForgeBuilder/1.0; +https://github.com/essentialbit/forge-builder)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Extract result links and snippets from DDG HTML
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const linkPattern = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    const snippetPattern = /class="result__snippet"[^>]*>([^<]+(?:<[^>]+>[^<]+<\/[^>]+>)*[^<]*)<\/a>/g;
    const urls: string[] = [];
    const titles: string[] = [];
    const snippets: string[] = [];

    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      const rawUrl = match[1];
      // DuckDuckGo uses redirect URLs — extract the real URL
      const uddg = rawUrl.match(/uddg=([^&]+)/);
      if (uddg) {
        urls.push(decodeURIComponent(uddg[1]));
        titles.push(match[2].replace(/<[^>]+>/g, '').trim());
      }
    }
    while ((match = snippetPattern.exec(html)) !== null) {
      snippets.push(match[1].replace(/<[^>]+>/g, '').trim());
    }

    for (let i = 0; i < Math.min(3, urls.length); i++) {
      results.push({ url: urls[i], title: titles[i] ?? '', snippet: snippets[i] ?? '' });
    }

    return results;
  } catch {
    return [];
  }
}

// ── Fetch and strip a page ────────────────────────────────────────────────

async function fetchPageContent(url: string): Promise<string> {
  try {
    // Only fetch from trusted domains for security
    const trusted = [
      'web.dev', 'developer.mozilla.org', 'developers.google.com',
      'w3.org', 'schema.org', 'nngroup.com', 'baymard.com',
      'shopify.com', 'bigcommerce.com', 'stripe.com',
      'gia.edu', 'owasp.org', 'github.com', 'nextjs.org',
      'tailwindcss.com', 'vercel.com', 'netlify.com',
    ];
    const domain = new URL(url).hostname.replace('www.', '');
    if (!trusted.some((t) => domain.includes(t))) {
      return ''; // Skip untrusted domains
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'ForgeBuilder/1.0 AI-Agent' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return '';
    const html = await res.text();

    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{3,}/g, '\n')
      .trim()
      .slice(0, MAX_CONTENT);
  } catch {
    return '';
  }
}

// ── Summarise with Ollama ─────────────────────────────────────────────────

async function summariseWithOllama(query: string, content: string, model: string): Promise<string> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `Question: "${query}"\n\nContent from web search:\n${content}`,
        system: `${FORGE_BUILDER_SYSTEM_PROMPT}\n\nYou are summarising web search results to answer a question about web building, e-commerce, or jewellery. Extract only the facts and recommendations that directly answer the question. Be concise (max 200 words). Format as bullet points if multiple facts.`,
        stream: false,
        options: { num_predict: 300, temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error('Ollama unavailable');
    const data = (await res.json()) as { response: string };
    return data.response.trim();
  } catch {
    // Return raw snippets as fallback
    return content.slice(0, 500) + '…';
  }
}

async function getActiveModel(): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { models: Array<{ name: string }> };
    const installed = data.models.map((m) => m.name);
    const PREFERRED = ['qwen2.5-coder:1.5b', 'phi3:mini', 'phi3.5:mini', 'llama3.2:3b'];
    return PREFERRED.find((p) => installed.some((m) => m.startsWith(p.split(':')[0]))) ?? installed[0] ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query: string };
    if (!query?.trim()) {
      return NextResponse.json({ error: 'query required' }, { status: 400 });
    }

    // Check online status
    try {
      const ping = await fetch('https://www.google.com/generate_204', {
        signal: AbortSignal.timeout(2000), method: 'HEAD'
      });
      if (ping.status !== 204) throw new Error('offline');
    } catch {
      return NextResponse.json({
        summary: "I'm currently offline and can't search the web. Let me answer from my built-in knowledge instead.",
        sources: [],
        offline: true,
      });
    }

    const [results, model] = await Promise.all([
      ddgSearch(query),
      getActiveModel(),
    ]);

    if (results.length === 0) {
      // Use DDG snippets as fallback
      return NextResponse.json({
        summary: `No results found for "${query}". Based on my training knowledge: this query relates to web building best practices which can be found at web.dev and developer.mozilla.org.`,
        sources: [],
      });
    }

    // Fetch content from top results (in parallel, with timeout)
    const contents = await Promise.all(
      results.slice(0, 2).map((r) => fetchPageContent(r.url))
    );
    const combinedContent = [
      ...results.map((r) => `Source: ${r.url}\n${r.snippet}`),
      ...contents.filter(Boolean),
    ].join('\n\n---\n\n').slice(0, MAX_CONTENT);

    const summary = model
      ? await summariseWithOllama(query, combinedContent, model)
      : results.map((r) => `• ${r.snippet}`).join('\n');

    return NextResponse.json({
      summary,
      sources: results.map((r) => r.url),
      model,
    });
  } catch (e) {
    console.error('[ai/search]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
