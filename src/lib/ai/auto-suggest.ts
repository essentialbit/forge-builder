/**
 * Forge Builder — Auto-Suggestions Engine
 *
 * Proactively analyses the builder state and generates contextual suggestions
 * for improving conversions, SEO, accessibility, and page structure.
 * Runs deterministically — no LLM required. Results shown in the AI panel.
 */

import type { AutoSuggestion, SuggestionType } from './types';

interface Section { id: string; type: string; settings?: Record<string, unknown> }
interface Page { id: string; name: string; path?: string; seo?: { title?: string; description?: string }; sections?: Section[] }
interface Project { pages?: Page[]; theme?: Record<string, unknown> }

let _suggestionCounter = 0;
function sid(type: SuggestionType): string {
  return `suggest-${type}-${++_suggestionCounter}`;
}

function suggest(
  type: SuggestionType,
  priority: 'high' | 'medium' | 'low',
  title: string,
  description: string,
  action?: AutoSuggestion['action']
): AutoSuggestion {
  return { id: sid(type), type, priority, title, description, action };
}

export function generateSuggestions(project: Project): AutoSuggestion[] {
  _suggestionCounter = 0;
  const suggestions: AutoSuggestion[] = [];
  const pages = project.pages ?? [];

  // ── SEO suggestions ──────────────────────────────────────────────────────

  const pagesWithoutTitle = pages.filter((p) => !p.seo?.title?.trim());
  if (pagesWithoutTitle.length > 0) {
    suggestions.push(suggest(
      'seo', 'high',
      `${pagesWithoutTitle.length} page(s) missing meta titles`,
      `Pages without titles hurt SEO. Add unique, keyword-rich titles to: ${pagesWithoutTitle.map((p) => p.name).join(', ')}.`,
      { label: 'Open SEO panel', type: 'navigate', payload: { tab: 'seo' } }
    ));
  }

  const pagesWithoutDesc = pages.filter((p) => !p.seo?.description?.trim());
  if (pagesWithoutDesc.length > 0) {
    suggestions.push(suggest(
      'seo', 'medium',
      `${pagesWithoutDesc.length} page(s) missing meta descriptions`,
      'Meta descriptions appear in Google search results — they directly affect click-through rates.',
      { label: 'Open SEO panel', type: 'navigate', payload: { tab: 'seo' } }
    ));
  }

  // ── Conversion suggestions ───────────────────────────────────────────────

  for (const page of pages) {
    const sections = page.sections ?? [];
    const sectionTypes = sections.map((s) => s.type);

    // Home page suggestions
    const isHome = !page.path || page.path === '/' || page.name.toLowerCase() === 'home';
    if (isHome) {
      if (!sectionTypes.includes('testimonials')) {
        suggestions.push(suggest(
          'conversion', 'high',
          'Add social proof to your homepage',
          'Testimonials are one of the highest-impact conversion elements for jewellery stores. Add a testimonials section with 6+ reviews.',
          { label: 'Add testimonials', type: 'add-section', payload: { type: 'testimonials', pageId: page.id } }
        ));
      }
      if (!sectionTypes.includes('newsletter')) {
        suggestions.push(suggest(
          'conversion', 'medium',
          'Capture email leads on your homepage',
          'A newsletter signup section builds your list for re-marketing. Jewellery stores see high ROI from email.',
          { label: 'Add newsletter', type: 'add-section', payload: { type: 'newsletter', pageId: page.id } }
        ));
      }
      if (!sectionTypes.includes('countdown-timer') && !sectionTypes.includes('promo-banner')) {
        suggestions.push(suggest(
          'conversion', 'low',
          'Add urgency to drive conversions',
          'A countdown timer or promo banner for a sale/free-shipping offer creates urgency. Even a permanent "Limited stock" banner helps.',
          { label: 'Add countdown timer', type: 'add-section', payload: { type: 'countdown-timer', pageId: page.id } }
        ));
      }
    }

    // Product pages: trust signals
    const hasProducts = sectionTypes.some((t) =>
      ['product-grid', 'featured-products', 'product-detail-hero', 'featured_product'].includes(t)
    );
    const hasTrust = sectionTypes.some((t) => ['trust-badges', 'payment-badges', 'testimonials'].includes(t));
    if (hasProducts && !hasTrust) {
      suggestions.push(suggest(
        'conversion', 'high',
        `"${page.name}" page has products but no trust signals`,
        'Adding payment badges or trust badges near product listings reduces buyer anxiety and increases add-to-cart rates by up to 30%.',
        { label: 'Add payment badges', type: 'add-section', payload: { type: 'payment-badges', pageId: page.id } }
      ));
    }

    // Jewellery: ring pages without ring size guide
    const isRingPage =
      page.name.toLowerCase().includes('ring') ||
      (page.path ?? '').toLowerCase().includes('ring');
    if (isRingPage && !sectionTypes.includes('ring-size-guide')) {
      suggestions.push(suggest(
        'ux', 'high',
        `"${page.name}" page is missing a ring size guide`,
        'Ring size guides are critical for online jewellery conversions. Customers need to know their size before buying.',
        { label: 'Add ring size guide', type: 'add-section', payload: { type: 'ring-size-guide', pageId: page.id } }
      ));
    }
  }

  // ── Content suggestions ──────────────────────────────────────────────────

  const totalSections = pages.reduce((sum, p) => sum + (p.sections?.length ?? 0), 0);
  if (pages.length > 0 && totalSections === 0) {
    suggestions.push(suggest(
      'content', 'high',
      'Your site has no content yet',
      'Start with a template — choose Jewellery Homepage, Collection Page, or Product Detail from the Templates panel.',
      { label: 'Open templates', type: 'navigate', payload: { tab: 'templates' } }
    ));
  }

  if (pages.length === 1) {
    suggestions.push(suggest(
      'content', 'medium',
      'Consider adding more pages',
      'Most jewellery stores need: Home, Shop/Collections, About, Contact, and a Ring Size Guide page.',
      { label: 'Add a page', type: 'navigate', payload: { tab: 'pages' } }
    ));
  }

  // ── Theme suggestions ────────────────────────────────────────────────────

  const theme = project.theme as Record<string, string> | undefined;
  const defaultGold = '#D4AF37';
  if (theme && Object.values(theme).every((v) => v === '#000000' || v === '#ffffff' || v === defaultGold)) {
    suggestions.push(suggest(
      'content', 'low',
      'Customise your brand colours',
      'Your Brand Kit still uses default colours. Set your primary, secondary, and accent colours to match your brand identity.',
      { label: 'Open Brand Kit', type: 'navigate', payload: { tab: 'brand-kit' } }
    ));
  }

  // Sort by priority
  const order = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => order[a.priority] - order[b.priority]);

  // Deduplicate by title (same suggestion for multiple pages → merge)
  const seen = new Set<string>();
  return suggestions.filter((s) => {
    if (seen.has(s.title)) return false;
    seen.add(s.title);
    return true;
  });
}
