/**
 * Forge Builder — Configuration Drift Detector
 *
 * Detects when section settings deviate from sensible defaults in ways
 * that are likely unintentional (configuration drift).
 *
 * Drift ≠ customisation. Drift is: placeholder text unchanged, expired timers,
 * forgotten spacers, single-column grids, etc.
 *
 * Each finding includes severity (info/warning/error) and the current vs expected value.
 */

import type { DriftFinding, DriftSeverity } from './types';

interface Section {
  id: string;
  type: string;
  settings?: Record<string, unknown>;
}

interface Page {
  id: string;
  name: string;
  sections?: Section[];
}

interface Project {
  pages?: Page[];
}

let _driftCounter = 0;
function driftId(): string {
  return `drift-${++_driftCounter}`;
}

function drift(
  sectionId: string,
  sectionType: string,
  field: string,
  currentValue: unknown,
  defaultValue: unknown,
  message: string,
  severity: DriftSeverity
): DriftFinding {
  return { id: driftId(), sectionId, sectionType, field, currentValue, defaultValue, message, severity };
}

// Default values for each section type (matching section-registry.ts)
const SECTION_DEFAULTS: Record<string, Record<string, unknown>> = {
  hero: {
    headline: 'Iced Out Jewelry',
    subheadline: 'Premium jewellery for those who stand out',
    cta_text: 'Shop Now',
    cta_link: '/shop',
    overlay_opacity: 50,
    height: 'large',
    animation: 'fade-in',
  },
  announcement: {
    text: 'Free shipping on orders over $100',
    link: '/shipping',
    background_color: '#D4AF37',
    text_color: '#000000',
    dismissible: true,
  },
  newsletter: {
    headline: 'Stay in the Loop',
    description: 'Get exclusive access to new arrivals, promotions, and more.',
    button_text: 'Subscribe',
    placeholder: 'your@email.com',
  },
  spacer: { height: 80, mobile_height: 40 },
  'product-grid': { columns: 3, show_prices: true, show_add_to_cart: true },
  'countdown-timer': { style: 'banner', expired_action: 'hide' },
  'video-hero': { overlay_opacity: 55, muted: true, autoplay: true },
  'image-block': { alt_text: '' },
};

// Placeholder text that indicates "never customised"
const PLACEHOLDER_TEXTS: Record<string, string[]> = {
  hero: ['Iced Out Jewelry', 'Premium jewellery for those who stand out'],
  announcement: ['Free shipping on orders over $100'],
  newsletter: ['Stay in the Loop', 'Get exclusive access to new arrivals, promotions, and more.'],
  'product-grid': ['Featured Products', 'Handpicked just for you'],
  'featured-products': ['Featured Products', 'Our most-loved pieces'],
  'promo-banner': ['Limited Time Offer', 'Don\'t miss out'],
  'collection-hero': ['Our Collection', 'Browse our full range'],
  footer: [],
};

function checkSection(section: Section): DriftFinding[] {
  const findings: DriftFinding[] = [];
  const s = section.settings ?? {};
  const type = section.type;
  const defaults = SECTION_DEFAULTS[type] ?? {};

  // ── Unchanged default text (high-confidence drift) ─────────────────────

  const placeholders = PLACEHOLDER_TEXTS[type] ?? [];
  const textFields = ['headline', 'subheadline', 'heading', 'text', 'title', 'description', 'subtitle'];
  for (const field of textFields) {
    const val = s[field] as string | undefined;
    if (val && placeholders.some((p) => p.toLowerCase() === val.toLowerCase())) {
      findings.push(drift(
        section.id, type, field, val, defaults[field] ?? '',
        `"${field}" appears unchanged from the default placeholder: "${val}". Customise it to reflect your brand.`,
        'warning'
      ));
    }
  }

  // ── Structural drift ────────────────────────────────────────────────────

  // Overlay opacity extremes (likely forgotten)
  if (type === 'hero' || type === 'video-hero' || type === 'promo-banner') {
    const opacity = s['overlay_opacity'] as number | undefined;
    const defOpacity = defaults['overlay_opacity'] as number | undefined;
    if (opacity !== undefined && defOpacity !== undefined) {
      if (Math.abs(opacity - defOpacity) > 40) {
        findings.push(drift(
          section.id, type, 'overlay_opacity', opacity, defOpacity,
          `Overlay opacity (${opacity}%) is far from the default (${defOpacity}%). Verify this is intentional.`,
          opacity < 20 || opacity > 90 ? 'warning' : 'info'
        ));
      }
    }
  }

  // Expired countdown timer
  if (type === 'countdown-timer') {
    const endDate = s['end_datetime'] as string | undefined;
    const expiredAction = s['expired_action'] as string | undefined;
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime()) && end < new Date()) {
        findings.push(drift(
          section.id, type, 'end_datetime',
          endDate, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          `Countdown timer expired on ${end.toLocaleDateString()}. ${expiredAction !== 'hide' ? 'Update the end date or set expired_action to "hide".' : 'Timer is hidden — update the end date to reactivate.'}`,
          expiredAction !== 'hide' ? 'error' : 'info'
        ));
      }
    }
  }

  // Product grid with 1 column
  if (type === 'product-grid' || type === 'featured-products') {
    const cols = s['columns'] as number | undefined;
    if (cols === 1) {
      findings.push(drift(
        section.id, type, 'columns', 1, 3,
        'Product grid is set to 1 column. This is almost never intentional — set to 3 for standard grid or 2 for featured.',
        'warning'
      ));
    }
  }

  // Oversized spacer (forgotten?)
  if (type === 'spacer') {
    const h = s['height'] as number | undefined;
    if (h && h > 200) {
      findings.push(drift(
        section.id, type, 'height', h, 80,
        `Spacer height is ${h}px — very large spacing may indicate a forgotten section. Expected: 40-120px.`,
        'warning'
      ));
    }
  }

  // Non-functional CTA links
  const BAD_LINKS = ['#', '', 'http://example.com', 'https://example.com'];
  const linkFields = ['cta_link', 'cta_url', 'link', 'link_url'];
  for (const field of linkFields) {
    const url = s[field] as string | undefined;
    if (url !== undefined && BAD_LINKS.includes(url.trim())) {
      findings.push(drift(
        section.id, type, field, url, '/shop',
        `"${field}" is set to "${url}" — this link will not work as expected. Set a real destination path.`,
        'error'
      ));
    }
  }

  // Missing image URL on image-block
  if (type === 'image-block') {
    const imgUrl = s['image_url'] as string | undefined;
    if (!imgUrl || imgUrl.trim() === '') {
      findings.push(drift(
        section.id, type, 'image_url', '', '',
        'Image block has no image URL set. Add an image or remove this section.',
        'warning'
      ));
    }
  }

  // Video hero with no video URL
  if (type === 'video-hero') {
    const videoUrl = s['video_url'] as string | undefined;
    if (!videoUrl || videoUrl.trim() === '') {
      findings.push(drift(
        section.id, type, 'video_url', '', '',
        'Video hero has no video URL set. Add a YouTube/Vimeo URL or use a regular hero section.',
        'error'
      ));
    }
  }

  // Testimonials: all 5-star ratings (looks inauthentic)
  if (type === 'testimonials') {
    const blocks = section.settings as unknown as Array<{ rating?: number }> | undefined;
    if (Array.isArray(blocks) && blocks.length >= 4) {
      const allFive = blocks.every((b) => (b as Record<string, unknown>)['rating'] === 5);
      if (allFive && blocks.length > 3) {
        findings.push(drift(
          section.id, type, 'blocks', '5-stars only', 'mixed ratings',
          'All testimonials are 5 stars. Consider including a few 4-star reviews for authenticity — perfect ratings can reduce buyer trust.',
          'info'
        ));
      }
    }
  }

  return findings;
}

export function detectDrift(project: Project): DriftFinding[] {
  _driftCounter = 0;
  const findings: DriftFinding[] = [];

  for (const page of project.pages ?? []) {
    for (const section of page.sections ?? []) {
      findings.push(...checkSection(section));
    }
  }

  // Sort: error > warning > info
  const order: Record<DriftSeverity, number> = { error: 0, warning: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return findings;
}
