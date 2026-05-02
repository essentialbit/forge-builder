/**
 * Forge Builder — Rule-Based Fallback Provider
 *
 * Always-available fallback when neither Ollama nor WebLLM are ready.
 * Uses template-based generation with contextual heuristics.
 * No external dependencies, zero latency, works fully offline.
 */

import type {
  AIProvider,
  AIProviderName,
  AIStatusDetail,
  ChatMessage,
  GenerateOptions,
  ModelInfo,
} from './types';

function titleCase(str: string): string {
  return str.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function extractTopic(text: string): string {
  const clean = text.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const stop = new Set(['the', 'a', 'an', 'for', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'with', 'make', 'create', 'add', 'generate', 'write', 'me', 'my']);
  const words = clean.split(/\s+/).filter((w) => !stop.has(w.toLowerCase()) && w.length > 2);
  return words.slice(0, 4).join(' ') || 'your jewellery store';
}

const SECTION_GENERATORS: Record<string, (topic: string, prompt: string) => Record<string, unknown>> = {
  hero: (topic) => ({
    headline: `Discover ${titleCase(topic)}`,
    subheadline: `Handcrafted with precision — explore pieces that tell your story.`,
    cta_text: 'Shop the Collection',
    cta_link: '/shop',
    height: 'large',
    animation: 'fade-up',
    overlay_opacity: 50,
  }),
  'video-hero': (topic) => ({
    headline: `The ${titleCase(topic)} Collection`,
    subheadline: 'Luxury jewellery, crafted for you.',
    cta_text: 'Explore Now',
    cta_url: '/shop',
    overlay_opacity: 55,
    muted: true,
    autoplay: true,
  }),
  announcement: (topic) => ({
    text: `Introducing ${titleCase(topic)} — Free shipping on all orders over $100`,
    background_color: '#D4AF37',
    text_color: '#000000',
    dismissible: true,
  }),
  newsletter: (topic) => ({
    headline: 'Join the Forge Club',
    description: `Be first to know about new ${topic.toLowerCase()} arrivals, exclusive offers, and styling tips.`,
    button_text: 'Subscribe',
    placeholder: 'your@email.com',
  }),
  'product-grid': (topic) => ({
    title: titleCase(topic),
    subtitle: 'Handpicked just for you',
    columns: 3,
    show_prices: true,
    show_add_to_cart: true,
  }),
  'featured-products': (topic) => ({
    title: `Featured ${titleCase(topic)}`,
    subtitle: 'Our most-loved pieces',
    display_style: 'grid',
    columns: 4,
  }),
  'rich-text': (topic, prompt) => ({
    content: `<h2>${titleCase(topic)}</h2><p>We believe quality craftsmanship and ethically sourced materials define exceptional jewellery. ${prompt.length > 40 ? 'Every piece in our collection is crafted with care, designed to last a lifetime.' : 'Explore our range and find something truly special.'}</p>`,
    text_alignment: 'left',
  }),
  'countdown-timer': () => {
    const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    return {
      headline: 'Flash Sale Ends In',
      subheadline: 'Up to 30% off selected pieces',
      cta_text: 'Shop Sale',
      cta_url: '/sale',
      end_datetime: end.toISOString(),
      style: 'banner',
      expired_action: 'hide',
    };
  },
  testimonials: () => ({
    _template_note: 'Add real customer testimonials for maximum impact. Aim for 6+ reviews with name, location, and rating.',
  }),
  faq: (topic) => ({
    _template_note: `Add frequently asked questions about ${topic.toLowerCase()} — sizing, care, materials, delivery.`,
  }),
  'promo-banner': (topic) => ({
    headline: `${titleCase(topic)} — Limited Time`,
    subheadline: 'Exclusive offer for our valued customers',
    cta_text: 'Shop Now',
    cta_url: '/shop',
    style: 'full',
  }),
  'payment-badges': () => ({
    show_visa: true,
    show_mastercard: true,
    show_amex: true,
    show_paypal: true,
    show_afterpay: true,
    show_ssl: true,
    show_secure_checkout: true,
    style: 'row',
  }),
};

const HELP_RESPONSES: Array<{ pattern: RegExp; response: string }> = [
  {
    pattern: /undo|redo/i,
    response: '**Undo/Redo**: Use **Cmd+Z** to undo and **Cmd+Shift+Z** to redo. You have 50 levels of history.',
  },
  {
    pattern: /publish|deploy|go live/i,
    response: '**Publishing**: Click the **Publish** button in the toolbar. This exports your site to JSON, pushes to GitHub, and triggers a Netlify deploy. Make sure you\'ve configured your GitHub repo and Netlify Site ID in the Publish settings.',
  },
  {
    pattern: /add section|new section/i,
    response: '**Adding sections**: Press **Cmd+K** to open the command palette, or click the **+** button between sections in the left panel. You can also drag sections from the Section Library.',
  },
  {
    pattern: /brand|colour|color|font|theme/i,
    response: '**Brand Kit**: Open the Brand Kit from the toolbar (paint palette icon). Set your primary colour, secondary, accent, background, and text colours, plus your heading and body fonts. Changes apply globally across all sections.',
  },
  {
    pattern: /mobile|tablet|responsive/i,
    response: '**Responsive preview**: Use the device icons in the **toolbar** (desktop/tablet/mobile) to preview how your site looks on different screen sizes.',
  },
  {
    pattern: /seo|meta|title|description/i,
    response: '**SEO settings**: Click the **SEO** tab in the left panel. Set your page title (50-60 chars), meta description (150-160 chars), and OG image for social sharing.',
  },
  {
    pattern: /duplicate|copy section/i,
    response: '**Duplicating sections**: Right-click a section in the left panel, or open the **⋮ menu** in the inspector on the right. Choose "Duplicate".',
  },
  {
    pattern: /save|autosave/i,
    response: '**Saving**: Forge Builder autosaves 3 seconds after you stop editing. You can also press **Cmd+S** to save immediately. The save indicator is shown in the toolbar.',
  },
  {
    pattern: /delete|remove section/i,
    response: '**Removing sections**: Select a section, then press **Delete** (or **Backspace**). You can also right-click in the left panel or use the trash icon in the inspector.',
  },
];

export class RulesBasedProvider implements AIProvider {
  readonly name: AIProviderName = 'rules-based';

  private _status: AIStatusDetail = {
    status: 'uninitialized',
    provider: 'rules-based',
    model: null,
  };

  getStatus(): AIStatusDetail {
    return { ...this._status };
  }

  getDefaultModel(): ModelInfo {
    return {
      provider: 'rules-based',
      modelId: 'forge-rules-v1',
      displayName: 'Forge Built-in (offline)',
      contextLength: 0,
      offline: true,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async initialize(): Promise<void> {
    this._status = {
      status: 'ready',
      provider: 'rules-based',
      model: {
        provider: 'rules-based',
        modelId: 'forge-rules-v1',
        displayName: 'Forge Built-in (offline)',
        contextLength: 0,
        offline: true,
      },
    };
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return "Hello! I'm the Forge Builder assistant. How can I help you build your store today?";
    return this._respond(lastUser.content);
  }

  async chatStream(
    messages: ChatMessage[],
    onToken: (token: string) => void
  ): Promise<void> {
    const response = await this.chat(messages);
    // Simulate streaming by splitting into words
    const words = response.split(' ');
    for (const word of words) {
      onToken(word + ' ');
      await new Promise((r) => setTimeout(r, 12));
    }
  }

  async generate(prompt: string, _systemPrompt?: string, _options?: GenerateOptions): Promise<string> {
    return this._respond(prompt);
  }

  private _respond(input: string): string {
    const lower = input.toLowerCase();

    // Check for section generation request
    const genMatch = lower.match(/generate|create|write|fill|autofill|auto.?fill/i);
    if (genMatch) {
      for (const [sectionType, generator] of Object.entries(SECTION_GENERATORS)) {
        if (lower.includes(sectionType.replace('-', ' ')) || lower.includes(sectionType)) {
          const topic = extractTopic(input);
          const settings = generator(topic, input);
          return `Here are suggested settings for your **${sectionType}** section:\n\n\`\`\`json\n${JSON.stringify(settings, null, 2)}\n\`\`\`\n\n> 💡 *Connect Ollama locally for richer, AI-generated content.*`;
        }
      }
    }

    // Check help responses
    for (const { pattern, response } of HELP_RESPONSES) {
      if (pattern.test(input)) return response;
    }

    // Default helpful response
    return `I'm here to help you build your Forge store! You can ask me to:

- **Generate content** — "Generate a hero section for a diamond ring collection"
- **Explain features** — "How do I publish my site?"
- **Best practices** — "What sections should a product page have?"
- **Troubleshoot** — "Why is my countdown timer not showing?"

> 💡 *For full AI capabilities, install [Ollama](https://ollama.com) and run \`ollama pull phi3:mini\` — then restart Forge Builder.*`;
  }
}
