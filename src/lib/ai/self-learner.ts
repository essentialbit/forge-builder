/**
 * Forge Builder — Self-Learning Module
 *
 * When an internet connection is available this module fetches high-quality,
 * freely available knowledge about web building, e-commerce, jewellery UX,
 * conversion optimisation, SEO, accessibility and security.
 *
 * It then uses the local Ollama model (if running) to summarise each source
 * into compact, reusable knowledge items stored in the SQLite knowledge base.
 * On next chat, the most relevant items are injected into the AI's context.
 *
 * Security:
 *   - Only allow-listed URLs are fetched (no arbitrary user-provided URLs)
 *   - Content is stripped of scripts/styles before summarisation
 *   - Rate-limited: each source fetched at most once per 24 hours
 *   - All network requests have a 10-second timeout
 *
 * The learner runs in the background (triggered from the API route) and
 * never blocks UI operations.
 */

import {
  upsertKnowledge,
  logLearnAttempt,
  wasRecentlyFetched,
  type KnowledgeCategory,
} from './knowledge-store';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_CONTENT_CHARS = 8_000; // Truncate before sending to LLM

// ── Allow-listed learning sources ──────────────────────────────────────────
// Each entry has a stable URL, a target category, and a brief hint for
// the summariser prompt. Only these URLs can ever be fetched.

export interface LearningSource {
  url: string;
  category: KnowledgeCategory;
  title: string;
  hint: string;              // Tells the summariser what to extract
  refreshHours: number;      // How often to re-fetch
}

export const LEARNING_SOURCES: LearningSource[] = [
  // E-commerce conversion
  {
    url: 'https://web.dev/articles/vitals',
    category: 'performance',
    title: 'Core Web Vitals (web.dev)',
    hint: 'Extract the key metrics (LCP, INP, CLS), their thresholds, and top improvement strategies.',
    refreshHours: 168, // weekly
  },
  {
    url: 'https://web.dev/articles/lcp',
    category: 'performance',
    title: 'Largest Contentful Paint (web.dev)',
    hint: 'Extract actionable strategies to improve LCP for image-heavy e-commerce pages.',
    refreshHours: 168,
  },
  {
    url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
    category: 'seo-strategy',
    title: 'Google SEO Starter Guide',
    hint: 'Extract the most important on-page SEO rules: titles, descriptions, headings, structured data.',
    refreshHours: 336, // fortnightly
  },
  {
    url: 'https://schema.org/Product',
    category: 'seo-strategy',
    title: 'Schema.org Product Structured Data',
    hint: 'Extract the most important Product schema properties for jewellery: name, image, price, material, color, sku, gtin.',
    refreshHours: 336,
  },
  {
    url: 'https://www.w3.org/WAI/WCAG21/quickref/?showtechniques=111',
    category: 'accessibility',
    title: 'WCAG 2.1 AA Quick Reference',
    hint: 'Extract the 10 most impactful WCAG 2.1 AA rules for e-commerce: alt text, contrast, focus, buttons.',
    refreshHours: 336,
  },
  {
    url: 'https://owasp.org/www-project-top-ten/',
    category: 'security',
    title: 'OWASP Top 10 Web Security Risks',
    hint: 'Extract actionable recommendations for each of the OWASP Top 10 risks relevant to web builders and CMSs.',
    refreshHours: 336,
  },
  // Jewellery domain
  {
    url: 'https://www.gia.edu/gem-education/lab-grown-diamonds',
    category: 'jewellery-domain',
    title: 'GIA: Lab-Grown Diamonds',
    hint: 'Extract key facts about lab-grown diamonds and moissanite that jewellery retailers should know for product copy.',
    refreshHours: 720, // monthly
  },
  // General e-commerce UX
  {
    url: 'https://www.nngroup.com/articles/ecommerce-ux/',
    category: 'ecommerce-best-practice',
    title: 'Nielsen Norman Group: E-commerce UX',
    hint: 'Extract the most critical e-commerce UX best practices: product pages, search, checkout, trust signals.',
    refreshHours: 336,
  },
  {
    url: 'https://baymard.com/lists/cart-abandonment-rate',
    category: 'conversion-optimisation',
    title: 'Baymard: Cart Abandonment Research',
    hint: 'Extract the top reasons for cart abandonment and actionable fixes for each.',
    refreshHours: 720,
  },
  // Web dev standards
  {
    url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path',
    category: 'web-dev',
    title: 'MDN: Critical Rendering Path',
    hint: 'Extract the key strategies to optimise the critical rendering path for fast page loads.',
    refreshHours: 720,
  },
];

// ── Content fetching ────────────────────────────────────────────────────────

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': 'ForgeBuilder/1.0 AI-Learner (+https://github.com/essentialbit/forge-builder)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return stripHTML(html).slice(0, MAX_CONTENT_CHARS);
  } catch {
    return null;
  }
}

function stripHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── Summarisation ───────────────────────────────────────────────────────────

async function summariseWithOllama(
  content: string,
  hint: string,
  ollamaHost = 'http://localhost:11434'
): Promise<string[] | null> {
  const systemPrompt = `You are a knowledge extractor for Forge Builder, an AI-powered web builder for jewellery e-commerce stores.

Extract exactly 3-6 concise, actionable knowledge items from the provided content.
Each item must:
- Be directly useful for building better jewellery/e-commerce websites
- Be a single clear fact or rule (max 120 words each)
- Start with a topic label in square brackets, e.g. [SEO], [Performance], [Accessibility]

Return ONLY a JSON array of strings. Example:
["[SEO] Use unique title tags under 60 chars containing primary keyword.", "[Performance] Images should use WebP format and lazy loading."]

Focus on: ${hint}`;

  try {
    const res = await fetch(`${ollamaHost}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi3:mini',
        prompt: content,
        system: systemPrompt,
        stream: false,
        options: { num_predict: 800, temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { response: string };
    const raw = data.response;

    // Extract JSON array
    const match = raw.match(/\[[\s\S]+\]/);
    if (!match) return null;
    const items = JSON.parse(match[0]) as string[];
    if (!Array.isArray(items)) return null;
    return items.filter((i) => typeof i === 'string' && i.length > 10).slice(0, 6);
  } catch {
    return null;
  }
}

/** Simple rule-based summariser when Ollama isn't available */
function summariseHeuristic(content: string, title: string): string[] {
  const sentences = content
    .split(/[.!?]\s+/)
    .filter((s) => s.length > 40 && s.length < 200)
    .slice(0, 4);
  return sentences.map((s) => `[${title}] ${s.trim()}.`);
}

// ── Online check ────────────────────────────────────────────────────────────

export async function isOnline(): Promise<boolean> {
  try {
    const res = await fetch('https://www.google.com/generate_204', {
      signal: AbortSignal.timeout(3000),
      method: 'HEAD',
    });
    return res.status === 204;
  } catch {
    return false;
  }
}

async function isOllamaRunning(host = 'http://localhost:11434'): Promise<boolean> {
  try {
    const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Main learner ────────────────────────────────────────────────────────────

export interface LearnResult {
  source: string;
  status: 'ok' | 'failed' | 'skipped';
  itemsLearned: number;
}

export async function learnFromSource(
  source: LearningSource,
  forceRefresh = false
): Promise<LearnResult> {
  // Skip if fetched recently
  if (!forceRefresh && wasRecentlyFetched(source.url, source.refreshHours)) {
    return { source: source.url, status: 'skipped', itemsLearned: 0 };
  }

  const content = await fetchPageText(source.url);
  if (!content) {
    logLearnAttempt(source.url, 'failed');
    return { source: source.url, status: 'failed', itemsLearned: 0 };
  }

  // Try Ollama summarisation first, fall back to heuristic
  const ollamaUp = await isOllamaRunning();
  let summaries: string[] | null = null;
  if (ollamaUp) {
    summaries = await summariseWithOllama(content, source.hint);
  }
  if (!summaries || summaries.length === 0) {
    summaries = summariseHeuristic(content, source.title);
  }
  if (!summaries || summaries.length === 0) {
    logLearnAttempt(source.url, 'failed');
    return { source: source.url, status: 'failed', itemsLearned: 0 };
  }

  // Store in knowledge base
  upsertKnowledge(summaries.map((summary, i) => ({
    category: source.category,
    title: `${source.title} (${i + 1})`,
    content: summary.slice(0, 500),
    source_url: source.url,
    confidence: ollamaUp ? 0.85 : 0.6,
  })));

  logLearnAttempt(source.url, 'ok', summaries.length);
  return { source: source.url, status: 'ok', itemsLearned: summaries.length };
}

/** Run a full learning cycle — call this from the /api/ai/learn route */
export async function runLearningCycle(
  options: { maxSources?: number; forceRefresh?: boolean } = {}
): Promise<{ online: boolean; results: LearnResult[]; totalItemsLearned: number }> {
  const online = await isOnline();
  if (!online) {
    return { online: false, results: [], totalItemsLearned: 0 };
  }

  const sources = LEARNING_SOURCES.slice(0, options.maxSources ?? LEARNING_SOURCES.length);
  const results: LearnResult[] = [];

  // Process sequentially to be polite to servers
  for (const source of sources) {
    const result = await learnFromSource(source, options.forceRefresh ?? false);
    results.push(result);
    // 200ms gap between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  const totalItemsLearned = results.reduce((sum, r) => sum + r.itemsLearned, 0);
  return { online: true, results, totalItemsLearned };
}
