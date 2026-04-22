/**
 * Static HTML renderer for published projects.
 * Converts Project + sections into standalone HTML/CSS files.
 *
 * Intentionally minimal: no React runtime, no JS frameworks —
 * the published site is plain, fast HTML. Sections render server-side
 * using the same layout conventions as the preview.
 */

import type { Project, Section } from '@/types/builder';
import catalog from '@/data/catalog.json';

type Theme = Project['theme'];
type CatalogProduct = {
  sku: string;
  slug: string;
  name: string;
  price: number;
  compare_price?: number | null;
  category: string;
  image: string;
  materials?: string;
};

function escape(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAUD(v: number): string {
  return '$' + v.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

const CATALOG_PRODUCTS = (catalog as { products: CatalogProduct[] }).products;

function pickProducts(slugs: string[] | undefined, fallbackCount: number): CatalogProduct[] {
  if (slugs && slugs.length > 0) {
    const bySlug = new Map(CATALOG_PRODUCTS.map((p) => [p.slug, p] as const));
    const bySku = new Map(CATALOG_PRODUCTS.map((p) => [p.sku.toLowerCase(), p] as const));
    const resolved = slugs
      .map((s) => bySlug.get(s) ?? bySku.get(s.toLowerCase()))
      .filter((p): p is CatalogProduct => Boolean(p));
    if (resolved.length > 0) return resolved;
  }
  return CATALOG_PRODUCTS.slice(0, fallbackCount);
}

function renderSection(section: Section, theme: Theme): string {
  const s = section.settings as Record<string, unknown>;

  switch (section.type) {
    case 'hero': {
      const headline = escape(s.headline ?? 'Welcome');
      const subheadline = escape(s.subheadline ?? '');
      const cta = escape(s.cta_text ?? 'Shop Now');
      const ctaLink = escape(s.cta_link ?? '#');
      const bgImg = escape(s.background_image_url ?? '');
      const overlay = Number(s.overlay_opacity ?? 50);
      const textAlign = String(s.text_alignment ?? 'center');
      const textColor = escape(s.text_color ?? '#fff');
      const bgColor = escape(s.background_color ?? '#000');
      return `
<section class="fb-hero" style="background:${bgColor};color:${textColor};text-align:${textAlign}">
  ${bgImg ? `<div class="fb-hero-bg" style="background-image:url('${bgImg}')"></div>` : ''}
  <div class="fb-hero-overlay" style="background:rgba(0,0,0,${overlay / 100})"></div>
  <div class="fb-hero-inner">
    <h1 style="color:${textColor};font-family:${escape(theme.fontFamily)}">${headline}</h1>
    ${subheadline ? `<p>${subheadline}</p>` : ''}
    <a class="fb-btn" style="background:${escape(theme.primaryColor)};color:${escape(theme.secondaryColor)}" href="${ctaLink}">${cta}</a>
  </div>
</section>`;
    }

    case 'announcement': {
      const text = escape(s.text ?? '');
      const link = escape(s.link ?? '');
      const bg = escape(s.background_color ?? theme.primaryColor);
      const tc = escape(s.text_color ?? theme.secondaryColor);
      const content = link ? `<a href="${link}">${text}</a>` : text;
      return `<div class="fb-announce" style="background:${bg};color:${tc}">${content}</div>`;
    }

    case 'product-grid': {
      const title = escape(s.title ?? 'Featured');
      const subtitle = escape(s.subtitle ?? '');
      const columns = Math.max(1, Math.min(5, Number(s.columns ?? 3)));
      const showPrices = s.show_prices !== false;
      const slugs = Array.isArray(s.product_slugs) ? (s.product_slugs as string[]) : [];
      const products = pickProducts(slugs, columns * 2);
      const items = products
        .slice(0, columns * 2)
        .map(
          (p) => `
    <article class="fb-product">
      <div class="fb-product-img"><img src="${escape(p.image)}" alt="${escape(p.name)}" loading="lazy"></div>
      <div class="fb-product-body">
        <h3>${escape(p.name)}</h3>
        ${showPrices ? `<div class="fb-product-price">${formatAUD(p.price)}${p.compare_price && p.compare_price > p.price ? ` <s>${formatAUD(p.compare_price)}</s>` : ''}</div>` : ''}
      </div>
    </article>`,
        )
        .join('');
      return `
<section class="fb-section fb-product-grid" style="background:${escape(theme.secondaryColor)};color:${escape(theme.accentColor)}">
  <div class="fb-inner">
    <h2 style="font-family:${escape(theme.fontFamily)}">${title}</h2>
    ${subtitle ? `<p class="fb-subtitle">${subtitle}</p>` : ''}
    <div class="fb-grid" style="grid-template-columns:repeat(${columns},minmax(0,1fr))">${items}</div>
  </div>
</section>`;
    }

    case 'category-showcase': {
      const title = escape(s.title ?? 'Shop by Category');
      const subtitle = escape(s.subtitle ?? '');
      const slugs = Array.isArray(s.category_slugs) ? (s.category_slugs as string[]) : ['rings', 'necklaces', 'bracelets', 'earrings'];
      const tiles = slugs
        .map((slug) => {
          const sample = CATALOG_PRODUCTS.find((p) => p.category.toLowerCase() === slug.toLowerCase());
          const img = sample?.image ?? '';
          return `
    <a class="fb-category" href="/collections/${escape(slug)}">
      <img src="${escape(img)}" alt="${escape(slug)}" loading="lazy">
      <span>${escape(slug.charAt(0).toUpperCase() + slug.slice(1))}</span>
    </a>`;
        })
        .join('');
      return `
<section class="fb-section fb-category-showcase" style="background:${escape(theme.secondaryColor)};color:${escape(theme.accentColor)}">
  <div class="fb-inner">
    <h2 style="font-family:${escape(theme.fontFamily)}">${title}</h2>
    ${subtitle ? `<p class="fb-subtitle">${subtitle}</p>` : ''}
    <div class="fb-category-grid">${tiles}</div>
  </div>
</section>`;
    }

    case 'rich-text': {
      const content = String(s.content ?? ''); // already HTML
      const maxWidth = Number(s.max_width ?? 800);
      const textAlign = String(s.text_alignment ?? 'left');
      return `
<section class="fb-section" style="background:${escape(theme.accentColor)};color:${escape(theme.secondaryColor)}">
  <div class="fb-rich" style="max-width:${maxWidth}px;text-align:${textAlign};font-family:${escape(theme.fontFamily)}">${content}</div>
</section>`;
    }

    case 'image-block': {
      const url = escape(s.image_url ?? '');
      const alt = escape(s.alt_text ?? '');
      const link = escape(s.link_url ?? '');
      const caption = escape(s.caption ?? '');
      const inner = `<img src="${url}" alt="${alt}" loading="lazy">${caption ? `<figcaption>${caption}</figcaption>` : ''}`;
      return `<figure class="fb-image">${link ? `<a href="${link}">${inner}</a>` : inner}</figure>`;
    }

    case 'trust-badges': {
      const badges = Array.isArray(s.badges) ? (s.badges as Array<{ label?: string; link?: string }>) : [];
      const items = badges
        .map((b) => `<a href="${escape(b.link ?? '#')}"><span class="fb-badge-icon">✓</span>${escape(b.label ?? '')}</a>`)
        .join('');
      return `<section class="fb-trust" style="background:${escape(theme.accentColor)};color:${escape(theme.secondaryColor)}"><div class="fb-inner">${items}</div></section>`;
    }

    case 'newsletter': {
      const heading = escape(s.heading ?? 'Subscribe');
      const description = escape(s.description ?? '');
      const buttonText = escape(s.button_text ?? 'Subscribe');
      return `
<section class="fb-newsletter" style="background:${escape(theme.primaryColor)};color:${escape(theme.secondaryColor)}">
  <div class="fb-inner fb-newsletter-inner">
    <h2 style="font-family:${escape(theme.fontFamily)}">${heading}</h2>
    ${description ? `<p>${description}</p>` : ''}
    <form class="fb-newsletter-form" onsubmit="event.preventDefault();alert('Thanks — this is a preview-only form.');">
      <input type="email" name="email" required placeholder="your@email.com">
      <button type="submit" style="background:${escape(theme.secondaryColor)};color:${escape(theme.primaryColor)}">${buttonText}</button>
    </form>
  </div>
</section>`;
    }

    case 'footer': {
      const columns = Array.isArray(s.columns) ? (s.columns as Array<{ heading?: string; links?: Array<{ label?: string; url?: string }> }>) : [];
      const copyright = escape(s.copyright_text ?? '');
      const social = Array.isArray(s.social_links) ? (s.social_links as Array<{ label?: string; url?: string }>) : [];
      const cols = columns
        .map(
          (c) => `
    <div>
      <h4>${escape(c.heading ?? '')}</h4>
      <ul>${(c.links ?? []).map((l) => `<li><a href="${escape(l.url ?? '#')}">${escape(l.label ?? '')}</a></li>`).join('')}</ul>
    </div>`,
        )
        .join('');
      const socials = social
        .map((l) => `<a href="${escape(l.url ?? '#')}">${escape(l.label ?? '')}</a>`)
        .join(' · ');
      return `
<footer class="fb-footer" style="background:${escape(theme.secondaryColor)};color:${escape(theme.accentColor)}">
  <div class="fb-inner">
    <div class="fb-footer-cols">${cols}</div>
    ${socials ? `<div class="fb-social">${socials}</div>` : ''}
    ${copyright ? `<p class="fb-copy">${copyright}</p>` : ''}
  </div>
</footer>`;
    }

    default:
      return `<!-- unknown section type: ${section.type} -->`;
  }
}

function baseCss(): string {
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:Inter,system-ui,sans-serif;line-height:1.5;color:#111;background:#fff}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
.fb-inner{max-width:1200px;margin:0 auto;padding:0 1.5rem}
.fb-section{padding:4rem 0}
.fb-section h2{font-size:2rem;font-weight:700;text-align:center;margin-bottom:0.5rem}
.fb-subtitle{text-align:center;opacity:0.7;margin-bottom:2.5rem}
.fb-btn{display:inline-block;padding:0.875rem 2rem;border-radius:9999px;font-weight:600;margin-top:1.5rem;transition:opacity 0.2s}
.fb-btn:hover{opacity:0.9}
.fb-hero{position:relative;min-height:60vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
.fb-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center}
.fb-hero-overlay{position:absolute;inset:0}
.fb-hero-inner{position:relative;z-index:1;padding:4rem 1.5rem;max-width:900px}
.fb-hero h1{font-size:clamp(2.25rem,5vw,4rem);font-weight:800;line-height:1.1;margin-bottom:1rem}
.fb-hero p{font-size:1.25rem;opacity:0.9}
.fb-announce{padding:0.75rem 1rem;text-align:center;font-size:0.875rem;font-weight:500}
.fb-grid{display:grid;gap:1.5rem}
.fb-product{background:#fff;color:#111;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
.fb-product-img{aspect-ratio:1/1;background:#f5f5f5;overflow:hidden}
.fb-product-img img{width:100%;height:100%;object-fit:cover}
.fb-product-body{padding:1rem}
.fb-product-body h3{font-size:0.95rem;font-weight:600;margin-bottom:0.5rem}
.fb-product-price{font-size:1.125rem;font-weight:700}
.fb-product-price s{font-weight:400;font-size:0.85em;opacity:0.5;margin-left:0.5rem}
.fb-category-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
@media(min-width:768px){.fb-category-grid{grid-template-columns:repeat(4,1fr)}}
.fb-category{position:relative;aspect-ratio:1/1;border-radius:12px;overflow:hidden;display:block}
.fb-category img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s}
.fb-category:hover img{transform:scale(1.05)}
.fb-category span{position:absolute;bottom:1rem;left:1rem;color:#fff;font-weight:700;font-size:1.125rem;text-shadow:0 1px 4px rgba(0,0,0,0.5)}
.fb-category::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.7),transparent)}
.fb-rich{margin:0 auto;padding:1.5rem}
.fb-rich p,.fb-rich h1,.fb-rich h2,.fb-rich h3{margin-bottom:1rem}
.fb-image{margin:2rem 0}
.fb-image figcaption{text-align:center;font-size:0.875rem;opacity:0.6;margin-top:0.5rem}
.fb-trust{padding:2rem 0;border-top:1px solid rgba(0,0,0,0.08);border-bottom:1px solid rgba(0,0,0,0.08)}
.fb-trust .fb-inner{display:flex;flex-wrap:wrap;justify-content:center;gap:2rem}
.fb-trust a{display:inline-flex;align-items:center;gap:0.5rem;font-size:0.9rem;font-weight:500}
.fb-badge-icon{display:inline-flex;align-items:center;justify-content:center;width:1.25rem;height:1.25rem;border-radius:50%;background:currentColor;color:#fff;font-size:0.75rem;opacity:0.8}
.fb-newsletter{padding:4rem 1.5rem;text-align:center}
.fb-newsletter-inner{max-width:640px}
.fb-newsletter h2{font-size:2rem;font-weight:700;margin-bottom:0.5rem}
.fb-newsletter-form{display:flex;gap:0.5rem;margin-top:1.5rem}
.fb-newsletter-form input{flex:1;padding:0.75rem 1rem;border-radius:9999px;border:none;font-size:1rem}
.fb-newsletter-form button{padding:0.75rem 1.5rem;border-radius:9999px;border:none;font-weight:600;cursor:pointer}
.fb-footer{padding:3rem 0 1.5rem}
.fb-footer-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:2rem;margin-bottom:2rem}
.fb-footer h4{font-size:0.9rem;font-weight:600;margin-bottom:0.75rem;text-transform:uppercase;letter-spacing:0.05em}
.fb-footer ul{list-style:none}
.fb-footer li{margin-bottom:0.5rem;opacity:0.8;font-size:0.9rem}
.fb-social{text-align:center;padding:1.5rem 0;opacity:0.8;font-size:0.9rem}
.fb-copy{text-align:center;opacity:0.6;font-size:0.85rem}
`;
}

export interface RenderedSite {
  files: Array<{ path: string; content: string }>; // path relative to site root
}

export function renderSite(
  project: Project,
  sectionsMap: Map<string, Section>,
): RenderedSite {
  const files: RenderedSite['files'] = [];
  const theme = project.theme;

  // CSS
  files.push({ path: 'assets/site.css', content: baseCss() });

  // Per-page HTML
  for (let i = 0; i < project.pages.length; i++) {
    const page = project.pages[i];
    const sections = page.sections
      .map((id) => sectionsMap.get(id))
      .filter((s): s is Section => Boolean(s));

    const body = sections.map((s) => renderSection(s, theme)).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(page.name)} — ${escape(project.name)}</title>
<meta name="description" content="${escape(project.description ?? '')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${escape(theme.fontFamily).replace(/ /g, '+')}:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
<style>body{font-family:'${escape(theme.fontFamily)}',system-ui,sans-serif;background:${escape(theme.accentColor)};color:${escape(theme.secondaryColor)}}</style>
</head>
<body>
${body}
<!-- Built with Forge Builder — ${new Date().toISOString()} -->
</body>
</html>`;

    const filePath = i === 0 || page.slug === '/' ? 'index.html' : `${page.slug.replace(/^\/+/, '').replace(/\/+$/, '') || page.id}/index.html`;
    files.push({ path: filePath, content: html });
  }

  // Manifest + robots
  files.push({
    path: 'robots.txt',
    content: 'User-agent: *\nAllow: /\n',
  });
  files.push({
    path: 'forge-builder.json',
    content: JSON.stringify(
      {
        project: { id: project.id, name: project.name, status: 'published' },
        generatedAt: new Date().toISOString(),
        pages: project.pages.map((p) => ({ id: p.id, name: p.name, slug: p.slug, sections: p.sections.length })),
      },
      null,
      2,
    ),
  });

  return { files };
}
