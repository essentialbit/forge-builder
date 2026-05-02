/**
 * POST /api/ai/generate
 *
 * Generates section settings using Ollama (LLM) with a rules-based fallback.
 *
 * Body: {
 *   sectionType: string,
 *   prompt: string,
 *   currentSettings?: Record<string, unknown>,
 *   schema?: Record<string, unknown>,
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { FORGE_BUILDER_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

interface GenerateBody {
  sectionType: string;
  prompt: string;
  currentSettings?: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

async function getActiveModel(): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { models: Array<{ name: string }> };
    const PREFERRED = ['qwen2.5-coder:1.5b', 'phi3:mini', 'phi3.5:mini', 'llama3.2:3b'];
    const installed = data.models.map((m) => m.name);
    return (
      PREFERRED.find((p) => installed.some((m) => m.startsWith(p.split(':')[0]))) ??
      installed[0] ??
      null
    );
  } catch {
    return null;
  }
}

function buildGeneratePrompt(body: GenerateBody): string {
  const { sectionType, prompt, currentSettings, schema } = body;
  return `Generate settings for a "${sectionType}" section in a jewellery e-commerce site.

USER REQUEST: "${prompt}"
${currentSettings ? `\nCURRENT SETTINGS (improve on these):\n${JSON.stringify(currentSettings, null, 2)}\n` : ''}
${schema ? `\nFIELD SCHEMA (only use these field names):\n${JSON.stringify(schema, null, 2)}\n` : ''}
RULES:
- Use elegant, aspirational jewellery brand language
- CTAs: action verbs ("Shop Now", "Explore Collection", "View All Rings")
- Image URLs: use https://images.unsplash.com/photo-XXXXXXXXXXXXXXX?w=1200&q=80
- Return ONLY a valid JSON object with no explanation or markdown.`;
}

function extractJSON(text: string): Record<string, unknown> | null {
  try { return JSON.parse(text) as Record<string, unknown>; } catch { /* continue */ }
  const block = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (block) { try { return JSON.parse(block[1]) as Record<string, unknown>; } catch { /* continue */ } }
  const obj = text.match(/\{[\s\S]+\}/);
  if (obj) { try { return JSON.parse(obj[0]) as Record<string, unknown>; } catch { /* continue */ } }
  return null;
}

// ── Fallback rules-based generators (kept for when Ollama is unavailable) ──

function titleCase(str: string): string {
  return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}
function seed(prompt: string): string {
  const stop = new Set(['the', 'a', 'an', 'for', 'me', 'my', 'our', 'make', 'create', 'add', 'generate']);
  return prompt.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/)
    .filter((w) => !stop.has(w.toLowerCase()) && w.length > 2).slice(0, 3).join(' ') || 'jewellery';
}

const FALLBACKS: Record<string, (prompt: string) => Record<string, unknown>> = {
  hero: (p) => {
    const t = titleCase(seed(p));
    return { headline: `Discover ${t}`, subheadline: 'Handcrafted for those who stand out.', cta_text: 'Shop the Collection', cta_link: '/shop', height: 'large', animation: 'fade-up', overlay_opacity: 50 };
  },
  'video-hero': (p) => ({
    headline: `The ${titleCase(seed(p))} Collection`, subheadline: 'Crafted to perfection.', cta_text: 'Explore Now', cta_url: '/shop', overlay_opacity: 55, muted: true, autoplay: true,
  }),
  announcement: (p) => ({ text: `Introducing ${titleCase(seed(p))} — Free shipping on orders over $100`, background_color: '#D4AF37', text_color: '#000000', dismissible: true }),
  newsletter: (p) => ({ headline: 'Join the Forge Club', description: `Stay ahead on ${seed(p).toLowerCase()} — new arrivals, exclusive offers, styling tips.`, button_text: 'Subscribe', placeholder: 'your@email.com' }),
  'product-grid': (p) => ({ title: titleCase(seed(p)), subtitle: 'Handpicked just for you', columns: 3, show_prices: true, show_add_to_cart: true }),
  'featured-products': (p) => ({ title: `Featured ${titleCase(seed(p))}`, subtitle: 'Our most-loved pieces', display_style: 'grid', columns: 4 }),
  'rich-text': (p) => ({ content: `<h2>${titleCase(seed(p))}</h2><p>We believe quality craftsmanship and ethically sourced materials define exceptional jewellery. Every piece in our collection is crafted with care, designed to last a lifetime.</p>`, text_alignment: 'left' }),
  'countdown-timer': () => ({ headline: 'Flash Sale Ends In', subheadline: 'Up to 30% off selected pieces', cta_text: 'Shop Sale', cta_url: '/sale', end_datetime: new Date(Date.now() + 3 * 86400000).toISOString(), style: 'banner', expired_action: 'hide' }),
  'promo-banner': (p) => ({ headline: `${titleCase(seed(p))} — Limited Time`, subheadline: 'Exclusive offer for our valued customers', cta_text: 'Shop Now', cta_url: '/shop', style: 'full' }),
  'payment-badges': () => ({ show_visa: true, show_mastercard: true, show_amex: true, show_paypal: true, show_afterpay: true, show_ssl: true, show_secure_checkout: true, style: 'row' }),
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as GenerateBody;
    const { sectionType, prompt } = body;

    if (!sectionType || !prompt) {
      return NextResponse.json({ error: 'sectionType and prompt are required' }, { status: 400 });
    }

    const model = await getActiveModel();

    // ── Ollama path ─────────────────────────────────────────────────────────
    if (model) {
      const ollamaRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: buildGeneratePrompt(body),
          system: FORGE_BUILDER_SYSTEM_PROMPT,
          stream: false,
          options: { num_predict: 600, temperature: 0.6 },
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (ollamaRes.ok) {
        const data = (await ollamaRes.json()) as { response: string };
        const settings = extractJSON(data.response);
        if (settings) return NextResponse.json({ settings, provider: 'ollama', model });
      }
    }

    // ── Rules-based fallback ────────────────────────────────────────────────
    const generator = FALLBACKS[sectionType];
    const settings = generator
      ? generator(prompt)
      : { _ai_note: `Customise the fields above for this "${sectionType}" section.` };

    return NextResponse.json({ settings, provider: 'rules-based' });
  } catch (e) {
    console.error('[ai/generate]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
