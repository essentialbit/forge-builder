/**
 * Forge Builder — SAST Analyzer
 *
 * Static Analysis Security Testing for builder configurations.
 * Runs on the current project state without any LLM — instant, offline, deterministic.
 *
 * Categories: security, performance, accessibility, seo, ux, content, configuration
 * Severities: critical > high > medium > low > info
 */

import type { SASTFinding, SASTSeverity, SASTCategory } from './types';

interface Section {
  id: string;
  type: string;
  settings?: Record<string, unknown>;
  blocks?: Array<Record<string, unknown>>;
}

interface Page {
  id: string;
  name: string;
  path?: string;
  seo?: { title?: string; description?: string; ogImage?: string };
  sections?: Section[];
}

interface Project {
  id: string;
  name?: string;
  pages?: Page[];
  theme?: Record<string, unknown>;
  deployConfig?: { githubRepo?: string; netlifySiteId?: string; customDomain?: string };
}

let _idCounter = 0;
function findingId(prefix: string): string {
  return `${prefix}-${++_idCounter}`;
}

function finding(
  severity: SASTSeverity,
  category: SASTCategory,
  message: string,
  recommendation: string,
  opts?: Partial<SASTFinding>
): SASTFinding {
  return { id: findingId(category), severity, category, message, recommendation, ...opts };
}

// ── Rule sets ────────────────────────────────────────────────────────────────

function analyzeSection(section: Section, _pageId: string): SASTFinding[] {
  const findings: SASTFinding[] = [];
  const s = section.settings ?? {};
  const type = section.type;

  // ── Security rules ──────────────────────────────────────────────────────

  // Insecure external URLs in CTA links
  const urlFields = ['cta_link', 'cta_url', 'link', 'link_url'];
  for (const field of urlFields) {
    const url = s[field] as string | undefined;
    if (url && url.startsWith('http://') && !url.includes('localhost')) {
      findings.push(finding(
        'high', 'security',
        `[${type}] "${field}" uses HTTP instead of HTTPS`,
        'Update the link to use HTTPS to protect user navigation and maintain SEO trust signals.',
        { sectionId: section.id, sectionType: type, field, cwe: 'CWE-311' }
      ));
    }
  }

  // Unsafe image sources
  const imageFields = ['background_image_url', 'image_url', 'poster_image', 'avatar_url'];
  const TRUSTED_IMAGE_DOMAINS = [
    'images.unsplash.com', 'cdn.shopify.com', 'res.cloudinary.com',
    'amazonaws.com', 'googleapis.com', 'imgix.net', 'imagekit.io',
    'forge', 'netlify', 'vercel', 'githubusercontent.com',
  ];
  for (const field of imageFields) {
    const url = s[field] as string | undefined;
    if (url && url.startsWith('http://') && !url.includes('localhost')) {
      const trusted = TRUSTED_IMAGE_DOMAINS.some((d) => url.includes(d));
      if (!trusted) {
        findings.push(finding(
          'medium', 'security',
          `[${type}] Image in "${field}" loads over HTTP from an untrusted domain`,
          'Host images on a CDN (Cloudinary, Unsplash, Imgix, AWS S3) and always serve over HTTPS.',
          { sectionId: section.id, sectionType: type, field, cwe: 'CWE-311' }
        ));
      }
    }
  }

  // ── Accessibility rules ─────────────────────────────────────────────────

  // Missing alt text on image blocks
  if (type === 'image-block') {
    const alt = s['alt_text'] as string | undefined;
    if (!alt || alt.trim() === '' || alt.toLowerCase() === 'image') {
      findings.push(finding(
        'high', 'accessibility',
        `[image-block] Missing or generic alt text`,
        'Provide a descriptive alt text that explains what the image shows. Leave empty ONLY for purely decorative images, and set role="presentation" in that case.',
        { sectionId: section.id, sectionType: type, field: 'alt_text', wcag: 'WCAG 2.1 AA 1.1.1' }
      ));
    }
  }

  // Uninformative CTA button text
  const ctaFields = ['cta_text', 'button_text'];
  const BAD_CTA = ['click here', 'read more', 'learn more', 'here', 'link', 'button'];
  for (const field of ctaFields) {
    const cta = (s[field] as string | undefined)?.toLowerCase().trim();
    if (cta && BAD_CTA.includes(cta)) {
      findings.push(finding(
        'medium', 'accessibility',
        `[${type}] CTA button text "${s[field]}" is not descriptive`,
        'Use action-oriented, descriptive CTA text: "Shop the Collection", "View Rings", "Get Free Shipping". Assistive technologies read these out of context.',
        { sectionId: section.id, sectionType: type, field, wcag: 'WCAG 2.1 AA 2.4.6' }
      ));
    }
  }

  // High overlay opacity reducing text contrast on hero
  if (type === 'hero' || type === 'video-hero' || type === 'promo-banner') {
    const opacity = s['overlay_opacity'] as number | undefined;
    if (opacity !== undefined && opacity < 30) {
      findings.push(finding(
        'medium', 'accessibility',
        `[${type}] Overlay opacity is ${opacity}% — text may not have sufficient contrast against background image`,
        'Set overlay opacity to at least 40% to ensure WCAG 2.1 AA 4.5:1 contrast ratio for text readability.',
        { sectionId: section.id, sectionType: type, field: 'overlay_opacity', wcag: 'WCAG 2.1 AA 1.4.3' }
      ));
    }
    if (opacity !== undefined && opacity > 85) {
      findings.push(finding(
        'low', 'ux',
        `[${type}] Overlay opacity is ${opacity}% — the background image is barely visible`,
        'Consider reducing overlay opacity to 50-70% to let the background image provide visual interest.',
        { sectionId: section.id, sectionType: type, field: 'overlay_opacity' }
      ));
    }
  }

  // ── Content quality rules ───────────────────────────────────────────────

  // Default placeholder content left unchanged
  const PLACEHOLDER_HEADLINES = ['Iced Out Jewelry', 'Your Store Name', 'Welcome', 'Hero Headline'];
  const headlineField = (s['headline'] ?? s['heading']) as string | undefined;
  if (headlineField && PLACEHOLDER_HEADLINES.some((p) => headlineField.toLowerCase().includes(p.toLowerCase()))) {
    findings.push(finding(
      'medium', 'content',
      `[${type}] Headline appears to be unchanged default content: "${headlineField}"`,
      'Customise your headline to reflect your brand and primary value proposition.',
      { sectionId: section.id, sectionType: type, field: 'headline' }
    ));
  }

  // Broken/placeholder CTA links
  const BAD_LINKS = ['#', '/', '', 'http://example.com', 'https://example.com'];
  for (const field of urlFields) {
    const url = s[field] as string | undefined;
    if (url !== undefined && BAD_LINKS.includes(url.trim())) {
      findings.push(finding(
        'high', 'ux',
        `[${type}] CTA link "${field}" is set to "${url}" — clicking will not navigate correctly`,
        'Set a real destination URL (e.g. "/shop", "/collections/rings", "https://...").',
        { sectionId: section.id, sectionType: type, field }
      ));
    }
  }

  // Expired countdown timer still visible
  if (type === 'countdown-timer') {
    const endDate = s['end_datetime'] as string | undefined;
    const expiredAction = s['expired_action'] as string | undefined;
    if (endDate) {
      const end = new Date(endDate);
      if (end < new Date() && expiredAction !== 'hide') {
        findings.push(finding(
          'high', 'ux',
          `[countdown-timer] Timer ended on ${end.toLocaleDateString()} but is still visible`,
          'Set "expired_action" to "hide" to automatically remove the timer when it expires, or update the end date.',
          { sectionId: section.id, sectionType: type, field: 'end_datetime' }
        ));
      }
    }
  }

  // Video hero: autoplay without mute (browser blocks autoplay with audio)
  if (type === 'video-hero') {
    const autoplay = s['autoplay'] as boolean | undefined;
    const muted = s['muted'] as boolean | undefined;
    if (autoplay && !muted) {
      findings.push(finding(
        'high', 'ux',
        `[video-hero] Autoplay is enabled but video is not muted`,
        'Browsers block autoplay for videos with audio. Enable "muted" to ensure the video plays automatically, or disable autoplay.',
        { sectionId: section.id, sectionType: type, field: 'muted' }
      ));
    }
  }

  // ── Performance rules ───────────────────────────────────────────────────

  // Oversized spacers
  if (type === 'spacer') {
    const height = s['height'] as number | undefined;
    if (height && height > 200) {
      findings.push(finding(
        'low', 'ux',
        `[spacer] Spacer height is ${height}px — this may create excessive blank space`,
        'Consider reducing to 80-120px for standard section separation, or using padding within adjacent sections.',
        { sectionId: section.id, sectionType: type, field: 'height' }
      ));
    }
  }

  // Product grid with 1 column (almost never intentional)
  if (type === 'product-grid') {
    const cols = s['columns'] as number | undefined;
    if (cols === 1) {
      findings.push(finding(
        'medium', 'ux',
        `[product-grid] Set to 1 column — this creates a single-column product list`,
        'For jewellery stores, 3 columns (desktop) is the most effective grid layout. Use 2 columns for featured/hero products.',
        { sectionId: section.id, sectionType: type, field: 'columns' }
      ));
    }
  }

  // Too many video sections (performance cost)
  return findings;
}

function analyzePage(page: Page): SASTFinding[] {
  const findings: SASTFinding[] = [];
  const sections = page.sections ?? [];

  // SEO checks
  if (!page.seo?.title || page.seo.title.trim() === '') {
    findings.push(finding(
      'high', 'seo',
      `Page "${page.name}" has no meta title`,
      'Set a unique, descriptive page title (50-60 characters). Example: "Diamond & Moissanite Rings | Forge Jewellery"'
    ));
  } else if (page.seo.title.length > 65) {
    findings.push(finding(
      'medium', 'seo',
      `Page "${page.name}" meta title is ${page.seo.title.length} chars (recommended: 50-60)`,
      'Shorten your meta title to under 60 characters to prevent truncation in search results.'
    ));
  }

  if (!page.seo?.description || page.seo.description.trim() === '') {
    findings.push(finding(
      'medium', 'seo',
      `Page "${page.name}" has no meta description`,
      'Add a compelling meta description (150-160 chars) that includes your primary keyword and a clear value proposition.'
    ));
  }

  // Multiple video heroes (performance)
  const videoHeroes = sections.filter((s) => s.type === 'video-hero').length;
  if (videoHeroes > 1) {
    findings.push(finding(
      'medium', 'performance',
      `Page "${page.name}" has ${videoHeroes} video hero sections`,
      'Multiple autoplay videos significantly increase load time and bandwidth. Keep to 1 per page.',
    ));
  }

  // No footer on the page
  const hasFooter = sections.some((s) => s.type === 'footer');
  if (sections.length > 3 && !hasFooter) {
    findings.push(finding(
      'medium', 'ux',
      `Page "${page.name}" has ${sections.length} sections but no footer`,
      'Add a footer section with navigation links, contact info, and legal links for a complete page experience.'
    ));
  }

  // No trust signals on pages with products
  const hasProductSection = sections.some((s) =>
    ['product-grid', 'featured-products', 'product-detail-hero', 'featured_product'].includes(s.type)
  );
  const hasTrust = sections.some((s) =>
    ['trust-badges', 'payment-badges', 'testimonials'].includes(s.type)
  );
  if (hasProductSection && !hasTrust && sections.length > 2) {
    findings.push(finding(
      'medium', 'conversion',
      `Page "${page.name}" has products but no trust signals (testimonials, trust badges, or payment badges)`,
      'Add a trust-badges or testimonials section near product listings. Trust signals can increase conversions by 15-30%.'
    ));
  }

  // Section-level analysis
  for (const section of sections) {
    findings.push(...analyzeSection(section, page.id));
  }

  return findings;
}

export function runSAST(project: Project): SASTFinding[] {
  _idCounter = 0; // Reset per analysis run
  const findings: SASTFinding[] = [];
  const pages = project.pages ?? [];

  // Project-level checks
  if (!project.deployConfig?.githubRepo) {
    findings.push(finding(
      'info', 'configuration',
      'No GitHub repository configured',
      'Connect a GitHub repo in Publish settings to enable version control and continuous deployment.'
    ));
  }

  if (pages.length === 0) {
    findings.push(finding(
      'high', 'configuration',
      'Project has no pages',
      'Add at least a home page to get started. Use the + button in the left panel.'
    ));
  }

  // Duplicate page paths
  const paths = pages.map((p) => p.path ?? `/${p.name.toLowerCase().replace(/\s+/g, '-')}`);
  const dupPaths = paths.filter((p, i) => paths.indexOf(p) !== i);
  for (const dup of [...new Set(dupPaths)]) {
    findings.push(finding(
      'high', 'configuration',
      `Duplicate page path: "${dup}"`,
      'Each page must have a unique URL path. Rename or remove duplicate pages.'
    ));
  }

  // Page-level analysis
  for (const page of pages) {
    findings.push(...analyzePage(page));
  }

  // Sort by severity
  const order: Record<SASTSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return findings;
}

/** Calculate a quality score 0-100 based on SAST findings */
export function calculateScore(findings: SASTFinding[]): number {
  const penalties: Record<SASTSeverity, number> = {
    critical: 25,
    high: 10,
    medium: 5,
    low: 2,
    info: 0,
  };
  const total = findings.reduce((sum, f) => sum + (penalties[f.severity] ?? 0), 0);
  return Math.max(0, Math.min(100, 100 - total));
}
