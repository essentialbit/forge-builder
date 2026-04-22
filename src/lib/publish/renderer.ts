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
import { listProducts, listCollections, productsInCollection } from '@/lib/catalog/queries';
import { normalizeTheme, getScheme, radiusValue, googleFontsHref } from '@/lib/theme';

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

/** Prefer DB catalog when available; fall back to bundled JSON. */
export function getCatalogProducts(): CatalogProduct[] {
  try {
    const rows = listProducts({ status: 'active', limit: 500 });
    if (rows.length > 0) {
      return rows.map((p) => ({
        sku: p.sku,
        slug: p.slug,
        name: p.title,
        price: p.price,
        compare_price: p.compareAtPrice ?? null,
        category: p.productType ?? '',
        image: p.featuredImage ?? '',
        materials: '',
      }));
    }
  } catch {
    /* fall through to JSON */
  }
  return (catalog as { products: CatalogProduct[] }).products;
}

/** Full DB product (includes description). Returns [] if DB not available. */
function getFullProducts() {
  try {
    return listProducts({ status: 'active', limit: 500 });
  } catch {
    return [];
  }
}

function getCollections() {
  try {
    return listCollections();
  } catch {
    return [];
  }
}

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

function pickProducts(
  products: CatalogProduct[],
  slugs: string[] | undefined,
  fallbackCount: number,
): CatalogProduct[] {
  if (slugs && slugs.length > 0) {
    const bySlug = new Map(products.map((p) => [p.slug, p] as const));
    const bySku = new Map(products.map((p) => [p.sku.toLowerCase(), p] as const));
    const resolved = slugs
      .map((s) => bySlug.get(s) ?? bySku.get(s.toLowerCase()))
      .filter((p): p is CatalogProduct => Boolean(p));
    if (resolved.length > 0) return resolved;
  }
  return products.slice(0, fallbackCount);
}

function renderSection(section: Section, theme: Theme, products: CatalogProduct[]): string {
  const s = section.settings as Record<string, unknown>;
  const raw = _renderSectionInner(section, theme, products, s);

  const r = section.responsive;
  if (!r || (!r.hideMobile && !r.hideTablet && !r.hideDesktop)) return raw;
  const classes = [
    r.hideMobile ? 'fb-hide-mobile' : '',
    r.hideTablet ? 'fb-hide-tablet' : '',
    r.hideDesktop ? 'fb-hide-desktop' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<div class="${classes}">${raw}</div>`;
}

function _renderSectionInner(
  section: Section,
  theme: Theme,
  products: CatalogProduct[],
  s: Record<string, unknown>,
): string {
  switch (section.type) {
    case 'hero': {
      const headline = escape(s.headline ?? 'Welcome');
      const subheadline = escape(s.subheadline ?? '');
      const cta = escape(s.cta_text ?? 'Shop Now');
      const ctaLink = escape(s.cta_link ?? '#');
      const bgImg = escape(s.background_image_url ?? '');
      const overlay = Number(s.overlay_opacity ?? 50);
      const textAlign = String(s.text_alignment ?? 'center');
      const animation = String(s.animation ?? 'fade-in');
      const height = String(s.height ?? 'large');
      const heightMap: Record<string, string> = {
        small: '40vh',
        medium: '60vh',
        large: '80vh',
        full: '100vh',
      };
      // Resolve color scheme if provided
      const schemeId = (s.color_scheme as string) || '';
      const theme2 = theme as ReturnType<typeof normalizeTheme>;
      const scheme = schemeId ? getScheme(theme2, schemeId) : null;
      const bg = scheme?.background ?? '#000';
      const text = scheme?.text ?? '#fff';
      const accent = scheme?.accent ?? theme2.primaryColor ?? '#D4AF37';
      const onAccent = scheme?.onAccent ?? theme2.secondaryColor ?? '#000';
      const animCls = animation !== 'none' ? `fb-anim-${animation}` : '';
      return `
<section class="fb-hero ${animCls}" style="background:${bg};color:${text};text-align:${textAlign};min-height:${heightMap[height] || '80vh'}">
  ${bgImg ? `<div class="fb-hero-bg" style="background-image:url('${bgImg}')"></div>` : ''}
  <div class="fb-hero-overlay" style="background:rgba(0,0,0,${overlay / 100})"></div>
  <div class="fb-hero-inner">
    <h1 style="color:${text}">${headline}</h1>
    ${subheadline ? `<p>${subheadline}</p>` : ''}
    <a class="fb-btn" style="background:${accent};color:${onAccent}" href="${ctaLink}">${cta}</a>
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
      const picked = pickProducts(products, slugs, columns * 2);
      const showCart = s.show_add_to_cart !== false;
      const items = picked
        .slice(0, columns * 2)
        .map((p) => {
          const cartJson = JSON.stringify({ sku: p.sku, name: p.name, price: p.price, image: p.image, slug: p.slug }).replace(/'/g, '&#39;');
          return `
    <article class="fb-product">
      <a href="/products/${escape(p.slug)}/" style="display:block;color:inherit;text-decoration:none">
        <div class="fb-product-img"><img src="${escape(p.image)}" alt="${escape(p.name)}" loading="lazy"></div>
        <div class="fb-product-body">
          <h3>${escape(p.name)}</h3>
          ${showPrices ? `<div class="fb-product-price">${formatAUD(p.price)}${p.compare_price && p.compare_price > p.price ? ` <s>${formatAUD(p.compare_price)}</s>` : ''}</div>` : ''}
        </div>
      </a>
      ${showCart ? `<button onclick='window.fbCart?.add(${cartJson})' style="margin:0 1rem 1rem;padding:0.5rem 1rem;background:var(--fb-accent,#000);color:var(--fb-on-accent,#fff);border:none;border-radius:var(--fb-radius,8px);font-weight:600;cursor:pointer;width:calc(100% - 2rem)">Add to cart</button>` : ''}
    </article>`;
        })
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
          const sample = products.find((p) => p.category.toLowerCase() === slug.toLowerCase());
          const img = sample?.image ?? '';
          return `
    <a class="fb-category" href="/collections/${escape(slug)}/">
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
      const listId = escape(s.list_id ?? 'newsletter');
      const formsEndpoint = escape(process.env.FORGE_FORMS_ENDPOINT ?? '');
      // If published to Netlify without a backend, fall back to mailto: on form submit.
      return `
<section class="fb-newsletter" style="background:${escape(theme.primaryColor)};color:${escape(theme.secondaryColor)}">
  <div class="fb-inner fb-newsletter-inner">
    <h2 style="font-family:${escape(theme.fontFamily)}">${heading}</h2>
    ${description ? `<p>${description}</p>` : ''}
    <form class="fb-newsletter-form" onsubmit="return fbNewsletterSubmit(event,'${listId}','${formsEndpoint}')">
      <input type="email" name="email" required placeholder="your@email.com">
      <button type="submit" style="background:${escape(theme.secondaryColor)};color:${escape(theme.primaryColor)}">${buttonText}</button>
    </form>
    <p id="fb-nl-msg" style="display:none;margin-top:1rem;opacity:0.8"></p>
  </div>
  <script>
    function fbNewsletterSubmit(ev, listId, endpoint){
      ev.preventDefault();
      const form = ev.target;
      const email = form.email.value;
      const msg = document.getElementById('fb-nl-msg');
      msg.style.display = 'block';
      msg.textContent = 'Submitting…';
      (endpoint
        ? fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({type:'newsletter', payload:{email, listId}}) })
        : Promise.resolve({ok:true})
      ).then(r => r.ok
        ? (msg.textContent = 'Thanks! You\u2019re subscribed.', form.reset())
        : (msg.textContent = 'Could not subscribe. Please try again later.')
      ).catch(() => msg.textContent = 'Could not subscribe. Please try again later.');
      return false;
    }
  <\/script>
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

    case 'faq': {
      const title = escape(s.title ?? 'Frequently asked questions');
      const subtitle = escape(s.subtitle ?? '');
      const items = Array.isArray(s.items) ? (s.items as Array<{ question?: string; answer?: string }>) : [];
      const body = items
        .map(
          (it, i) => `
      <details class="fb-faq-item" ${i === 0 ? 'open' : ''}>
        <summary>${escape(it.question ?? '')}</summary>
        <p>${escape(it.answer ?? '')}</p>
      </details>`,
        )
        .join('');
      return `
<section class="fb-section fb-faq">
  <div class="fb-inner" style="margin:0 auto;padding:0 1.5rem;max-width:760px">
    <h2 style="text-align:center;font-size:2rem;font-weight:700;margin-bottom:0.5rem">${title}</h2>
    ${subtitle ? `<p style="text-align:center;opacity:0.7;margin-bottom:2rem">${subtitle}</p>` : ''}
    ${body}
  </div>
</section>`;
    }

    case 'featured_product': {
      const slugs = Array.isArray(s.product_slugs) ? (s.product_slugs as string[]) : [];
      const picked = pickProducts(products, slugs, 1)[0];
      if (!picked) return '<!-- no product selected -->';
      const layout = String(s.layout ?? 'split');
      const showDesc = s.show_description !== false;
      const flip = layout === 'split-reverse';
      const stacked = layout === 'stacked';
      const cartJson = JSON.stringify({ sku: picked.sku, name: picked.name, price: picked.price, image: picked.image, slug: picked.slug }).replace(/'/g, '&#39;');
      const fullDesc = fullProductsCache.get(picked.slug)?.description ?? '';
      return `
<section class="fb-section">
  <div class="fb-inner" style="margin:0 auto;padding:0 1.5rem;display:${stacked ? 'block' : 'grid'};grid-template-columns:${flip ? '1fr 1fr' : '1fr 1fr'};gap:3rem;${flip ? 'direction:rtl;' : ''}">
    <div ${flip ? 'style="direction:ltr"' : ''}>
      <img src="${escape(picked.image)}" alt="${escape(picked.name)}" style="width:100%;border-radius:var(--fb-radius);background:#f5f5f5" loading="lazy">
    </div>
    <div ${flip ? 'style="direction:ltr"' : ''}>
      <h2 style="font-size:2rem;font-weight:700;margin-bottom:1rem">${escape(picked.name)}</h2>
      <div style="font-size:1.5rem;font-weight:700;margin-bottom:1rem">${formatAUD(picked.price)}</div>
      ${showDesc && fullDesc ? `<div class="fb-rich" style="margin-bottom:1.5rem">${fullDesc}</div>` : ''}
      <button onclick='window.fbCart?.add(${cartJson})' style="padding:1rem 2rem;background:var(--fb-accent);color:var(--fb-on-accent);border:none;border-radius:var(--fb-radius);font-weight:700;cursor:pointer">Add to cart</button>
      <a href="/products/${escape(picked.slug)}/" style="margin-left:1rem;color:var(--fb-accent);text-decoration:underline">View details</a>
    </div>
  </div>
</section>`;
    }

    case 'testimonials': {
      const title = escape(s.title ?? 'What our customers say');
      const items = Array.isArray(s.items) ? (s.items as Array<{ quote?: string; author?: string; rating?: number }>) : [];
      const cards = items
        .map(
          (it) => `
    <figure style="background:#fff;color:#111;padding:1.5rem;border-radius:var(--fb-radius);box-shadow:0 1px 3px rgba(0,0,0,0.08)">
      <div style="color:#f59e0b;margin-bottom:0.75rem">${'★'.repeat(Math.max(1, Math.min(5, Number(it.rating ?? 5))))}</div>
      <blockquote style="font-style:italic;margin-bottom:1rem;font-size:0.95rem">“${escape(it.quote ?? '')}”</blockquote>
      <figcaption style="font-weight:600;font-size:0.85rem;opacity:0.7">— ${escape(it.author ?? '')}</figcaption>
    </figure>`,
        )
        .join('');
      return `
<section class="fb-section">
  <div class="fb-inner" style="margin:0 auto;padding:0 1.5rem">
    <h2 style="text-align:center;font-size:2rem;font-weight:700;margin-bottom:2rem">${title}</h2>
    <div class="fb-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">${cards}</div>
  </div>
</section>`;
    }

    case 'spacer': {
      const h = Number(s.height ?? 80);
      return `<div style="height:${h}px"></div>`;
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
.fb-faq-item{border-bottom:1px solid rgba(0,0,0,0.1);padding:1rem 0}
.fb-faq-item summary{font-weight:600;cursor:pointer;font-size:1rem;list-style:none;display:flex;align-items:center;justify-content:space-between}
.fb-faq-item summary::-webkit-details-marker{display:none}
.fb-faq-item summary::after{content:'+';font-size:1.5rem;opacity:0.5;transition:transform 0.2s}
.fb-faq-item[open] summary::after{transform:rotate(45deg)}
.fb-faq-item p{margin-top:0.75rem;opacity:0.8;line-height:1.6}
`;
}

export interface RenderedSite {
  files: Array<{ path: string; content: string }>; // path relative to site root
}

// Per-render cache used by featured_product to get description
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fullProductsCache: Map<string, any> = new Map();

/* =============================================================
 * Theme CSS variables + reset injected per site
 * ============================================================= */
function themeCss(theme: ReturnType<typeof normalizeTheme>): string {
  const def = getScheme(theme);
  const radius = radiusValue(theme.radiusScale);
  const spacing = theme.spacingScale === 'tight' ? '2rem' : theme.spacingScale === 'relaxed' ? '6rem' : '4rem';
  const maxW = `${theme.maxContentWidth ?? 1200}px`;
  return `
:root {
  --fb-bg: ${def.background};
  --fb-text: ${def.text};
  --fb-accent: ${def.accent};
  --fb-on-accent: ${def.onAccent};
  --fb-muted: ${def.muted};
  --fb-border: ${def.border};
  --fb-radius: ${radius};
  --fb-spacing: ${spacing};
  --fb-max-w: ${maxW};
  --fb-font: ${JSON.stringify(theme.fontFamily)};
  --fb-heading-font: ${JSON.stringify(theme.headingFontFamily ?? theme.fontFamily)};
}
html,body{font-family:var(--fb-font),system-ui,sans-serif;background:var(--fb-bg);color:var(--fb-text)}
h1,h2,h3,h4{font-family:var(--fb-heading-font),system-ui,sans-serif}
.fb-inner{max-width:var(--fb-max-w)}
.fb-section{padding:var(--fb-spacing) 0}
.fb-btn{border-radius:var(--fb-radius)}
.fb-product{border-radius:var(--fb-radius)}
.fb-category{border-radius:var(--fb-radius)}
.fb-newsletter-form input,.fb-newsletter-form button{border-radius:var(--fb-radius)}
/* Animations */
@keyframes fade-in{from{opacity:0}to{opacity:1}}
@keyframes fade-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes zoom-in{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
.fb-anim-fade-in{animation:fade-in 0.8s ease both}
.fb-anim-fade-up{animation:fade-up 0.8s ease both}
.fb-anim-zoom-in{animation:zoom-in 0.8s ease both}
/* Cart drawer (used on all pages via cart.js) */
#fb-cart-drawer{position:fixed;top:0;right:-420px;height:100vh;width:min(420px,90vw);background:#fff;color:#111;box-shadow:-10px 0 30px rgba(0,0,0,0.2);transition:right 0.3s ease;z-index:9999;display:flex;flex-direction:column}
#fb-cart-drawer.open{right:0}
#fb-cart-drawer header{padding:1.25rem;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center}
#fb-cart-drawer .fb-cart-items{flex:1;overflow-y:auto;padding:1rem}
#fb-cart-drawer footer{padding:1.25rem;border-top:1px solid #eee}
#fb-cart-drawer .fb-cart-total{display:flex;justify-content:space-between;font-weight:700;margin-bottom:1rem}
#fb-cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9998;display:none}
#fb-cart-overlay.open{display:block}
.fb-header{position:sticky;top:0;z-index:50;background:var(--fb-bg);border-bottom:1px solid var(--fb-border);padding:1rem 0}
.fb-header-inner{max-width:var(--fb-max-w);margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;gap:2rem}
.fb-header-inner .fb-brand{font-weight:800;font-size:1.25rem}
/* Responsive visibility */
@media(max-width:640px){.fb-hide-mobile{display:none !important}}
@media(min-width:641px) and (max-width:1024px){.fb-hide-tablet{display:none !important}}
@media(min-width:1025px){.fb-hide-desktop{display:none !important}}
/* Mobile product grid defaults to 2 cols unless overridden */
@media(max-width:640px){.fb-grid{grid-template-columns:repeat(2,1fr) !important}}
@media(max-width:420px){.fb-grid{grid-template-columns:1fr !important}}
.fb-header-inner nav{flex:1;display:flex;gap:1.5rem}
.fb-header-inner a{color:var(--fb-text);text-decoration:none;font-size:0.95rem}
.fb-cart-btn{background:none;border:1px solid var(--fb-border);padding:0.5rem 1rem;cursor:pointer;font-weight:600;border-radius:var(--fb-radius);color:var(--fb-text)}
`;
}

/* =============================================================
 * Cart: tiny client runtime (no framework) using localStorage
 * ============================================================= */
function cartJs(): string {
  return `/* Forge Builder — cart runtime */
(function(){
  const KEY = 'fb_cart_v1';
  function read(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } }
  function write(c){ localStorage.setItem(KEY, JSON.stringify(c)); update(); }
  function find(c, sku){ return c.findIndex(i => i.sku === sku); }
  function add(item){
    const c = read(); const i = find(c, item.sku);
    if (i >= 0) c[i].qty = (c[i].qty||1) + (item.qty||1);
    else c.push(Object.assign({qty:1}, item));
    write(c); open();
  }
  function remove(sku){ write(read().filter(i => i.sku !== sku)); }
  function setQty(sku, qty){
    const c = read(); const i = find(c, sku); if (i<0) return;
    if (qty<=0) c.splice(i,1); else c[i].qty = qty; write(c);
  }
  function total(c){ return c.reduce((s,i)=>s + (i.price||0) * (i.qty||1), 0); }
  function money(n){ return '$' + Number(n).toFixed(2); }
  function escape(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function render(){
    const c = read();
    const el = document.querySelector('#fb-cart-items');
    const tot = document.querySelector('#fb-cart-total');
    const badge = document.querySelectorAll('.fb-cart-count');
    if (!el) return;
    if (c.length === 0) {
      el.innerHTML = '<p style="opacity:0.5;text-align:center;padding:2rem">Your cart is empty.</p>';
    } else {
      el.innerHTML = c.map(i => \`
        <div style="display:flex;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid #eee">
          <img src="\${escape(i.image)}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:4px;background:#f5f5f5">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:0.9rem">\${escape(i.name)}</div>
            <div style="font-size:0.8rem;opacity:0.6">\${escape(i.sku)}</div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem">
              <button onclick="window.fbCart.setQty('\${escape(i.sku)}',\${i.qty-1})" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:4px">−</button>
              <span>\${i.qty}</span>
              <button onclick="window.fbCart.setQty('\${escape(i.sku)}',\${i.qty+1})" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:4px">+</button>
              <button onclick="window.fbCart.remove('\${escape(i.sku)}')" style="margin-left:auto;color:#c00;background:none;border:none;cursor:pointer;font-size:0.85rem">Remove</button>
            </div>
          </div>
          <div style="font-weight:700">\${money(i.price * i.qty)}</div>
        </div>\`).join('');
    }
    if (tot) tot.textContent = money(total(c));
    badge.forEach(b => b.textContent = c.reduce((s,i)=>s+(i.qty||1),0));
  }
  function open(){ document.getElementById('fb-cart-drawer')?.classList.add('open'); document.getElementById('fb-cart-overlay')?.classList.add('open'); }
  function close(){ document.getElementById('fb-cart-drawer')?.classList.remove('open'); document.getElementById('fb-cart-overlay')?.classList.remove('open'); }
  function update(){ render(); }
  async function checkout(){
    const c = read();
    if (c.length === 0) { alert('Your cart is empty.'); return; }
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({items:c}) });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert('Checkout ready. Demo site — no payment processor configured.');
      } else {
        alert('Checkout is not yet configured for this site.');
      }
    } catch {
      alert('Checkout is not yet configured for this site.');
    }
  }
  window.fbCart = { add, remove, setQty, open, close, render, read, checkout };
  document.addEventListener('DOMContentLoaded', render);
})();
`;
}

/* =============================================================
 * Header + Footer (shared across product/collection pages)
 * ============================================================= */
function commonHeader(project: Project, theme: ReturnType<typeof normalizeTheme>): string {
  const pages = project.pages.slice(0, 5);
  const navLinks = pages
    .map((p, i) => `<a href="${i === 0 ? '/' : `/${p.slug.replace(/^\/+/, '').replace(/\/+$/, '') || p.id}/`}">${escape(p.name)}</a>`)
    .join('');
  return `<header class="fb-header">
  <div class="fb-header-inner">
    <a href="/" class="fb-brand" style="font-family:var(--fb-heading-font)">${theme.logo ? `<img src="${escape(theme.logo)}" alt="${escape(project.name)}" style="max-height:40px">` : escape(project.name)}</a>
    <nav>${navLinks}</nav>
    <button class="fb-cart-btn" onclick="window.fbCart?.open()">Cart (<span class="fb-cart-count">0</span>)</button>
  </div>
</header>`;
}

function cartDrawer(): string {
  return `<div id="fb-cart-overlay" onclick="window.fbCart?.close()"></div>
<aside id="fb-cart-drawer" aria-label="Shopping cart">
  <header>
    <h2 style="margin:0;font-size:1.1rem">Your cart</h2>
    <button onclick="window.fbCart?.close()" style="background:none;border:none;font-size:1.5rem;cursor:pointer">×</button>
  </header>
  <div class="fb-cart-items" id="fb-cart-items"></div>
  <footer>
    <div class="fb-cart-total">
      <span>Total</span>
      <span id="fb-cart-total">$0.00</span>
    </div>
    <button onclick="window.fbCart?.checkout()" style="width:100%;padding:0.875rem;background:var(--fb-accent);color:var(--fb-on-accent);border:none;border-radius:var(--fb-radius);font-weight:700;cursor:pointer">Checkout</button>
  </footer>
</aside>`;
}

/* =============================================================
 * Product detail page
 * ============================================================= */
function renderProductPage(
  project: Project,
  theme: ReturnType<typeof normalizeTheme>,
  p: Awaited<ReturnType<typeof listProducts>>[number],
  fontsHref: string,
): string {
  const safeDesc = (p.description || '').toString();
  const title = `${escape(p.title)} — ${escape(project.name)}`;
  const comparePrice = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : null;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${escape(p.seoDescription || p.title)}">
<meta property="og:title" content="${escape(p.title)}">
<meta property="og:type" content="product">
<meta property="og:image" content="${escape(p.featuredImage || '')}">
${fontsHref ? `<link rel="stylesheet" href="${fontsHref}">` : ''}
<link rel="stylesheet" href="/assets/site.css">
<script defer src="/assets/cart.js"><\/script>
</head>
<body>
${commonHeader(project, theme)}
${cartDrawer()}

<section class="fb-section">
  <div class="fb-inner" style="margin:0 auto;padding:0 1.5rem;display:grid;grid-template-columns:1fr 1fr;gap:3rem">
    <div>
      <img src="${escape(p.featuredImage)}" alt="${escape(p.title)}" style="width:100%;border-radius:var(--fb-radius);background:#f5f5f5">
    </div>
    <div>
      <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:0.75rem;opacity:0.6;margin-bottom:0.5rem">${escape(p.productType)}</p>
      <h1 style="font-size:2.25rem;font-weight:700;line-height:1.15;margin-bottom:1rem">${escape(p.title)}</h1>
      <div style="display:flex;align-items:baseline;gap:0.75rem;margin-bottom:1.5rem">
        <span style="font-size:1.75rem;font-weight:700">${formatAUD(p.price)}</span>
        ${comparePrice ? `<span style="text-decoration:line-through;opacity:0.5">${formatAUD(comparePrice)}</span>` : ''}
      </div>
      <div class="fb-rich" style="margin-bottom:2rem">${safeDesc}</div>
      ${p.inStock
        ? `<button onclick='window.fbCart.add(${JSON.stringify({
            sku: p.sku,
            name: p.title,
            price: p.price,
            image: p.featuredImage,
            slug: p.slug,
          }).replace(/'/g, "&#39;")})' style="width:100%;padding:1rem;background:var(--fb-accent);color:var(--fb-on-accent);border:none;border-radius:var(--fb-radius);font-weight:700;font-size:1rem;cursor:pointer">Add to cart</button>`
        : `<button disabled style="width:100%;padding:1rem;background:#ddd;color:#888;border:none;border-radius:var(--fb-radius);font-weight:700">Out of stock</button>`}
      <div style="margin-top:1.5rem;font-size:0.85rem;opacity:0.6">
        SKU: <code>${escape(p.sku)}</code>
      </div>
    </div>
  </div>
</section>
</body>
</html>`;
}

function renderCollectionPage(
  project: Project,
  theme: ReturnType<typeof normalizeTheme>,
  c: Awaited<ReturnType<typeof listCollections>>[number],
  items: Awaited<ReturnType<typeof listProducts>>,
  fontsHref: string,
): string {
  const cards = items
    .map(
      (p) => `<a href="/products/${escape(p.slug)}/" style="background:#fff;color:#111;border-radius:var(--fb-radius);overflow:hidden;display:block;text-decoration:none;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
  <div style="aspect-ratio:1/1;background:#f5f5f5"><img src="${escape(p.featuredImage)}" alt="${escape(p.title)}" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>
  <div style="padding:0.875rem">
    <div style="font-weight:600;font-size:0.92rem;line-height:1.3;margin-bottom:0.25rem">${escape(p.title)}</div>
    <div style="font-weight:700">${formatAUD(p.price)}</div>
  </div>
</a>`,
    )
    .join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(c.title)} — ${escape(project.name)}</title>
<meta name="description" content="${escape(c.seoDescription || c.description || c.title)}">
${fontsHref ? `<link rel="stylesheet" href="${fontsHref}">` : ''}
<link rel="stylesheet" href="/assets/site.css">
<script defer src="/assets/cart.js"><\/script>
</head>
<body>
${commonHeader(project, theme)}
${cartDrawer()}

<section class="fb-section">
  <div class="fb-inner" style="margin:0 auto;padding:0 1.5rem">
    <h1 style="font-size:2.5rem;font-weight:700;text-align:center;margin-bottom:0.5rem">${escape(c.title)}</h1>
    ${c.description ? `<p style="text-align:center;opacity:0.7;margin-bottom:2rem">${escape(c.description)}</p>` : '<div style="margin-bottom:2rem"></div>'}
    <p style="text-align:center;opacity:0.6;font-size:0.9rem;margin-bottom:2rem">${items.length} product${items.length === 1 ? '' : 's'}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.5rem">${cards}</div>
  </div>
</section>
</body>
</html>`;
}

function renderCartPage(
  project: Project,
  theme: ReturnType<typeof normalizeTheme>,
  fontsHref: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cart — ${escape(project.name)}</title>
${fontsHref ? `<link rel="stylesheet" href="${fontsHref}">` : ''}
<link rel="stylesheet" href="/assets/site.css">
<script defer src="/assets/cart.js"><\/script>
</head>
<body>
${commonHeader(project, theme)}
${cartDrawer()}
<section class="fb-section">
  <div class="fb-inner" style="margin:0 auto;padding:0 1.5rem;max-width:720px">
    <h1 style="font-size:2rem;font-weight:700;margin-bottom:2rem">Your cart</h1>
    <div id="fb-cart-page"></div>
    <script>
      document.addEventListener('DOMContentLoaded', function(){
        const c = window.fbCart.read();
        const root = document.getElementById('fb-cart-page');
        if (!c || c.length === 0) {
          root.innerHTML = '<p style="opacity:0.6;text-align:center;padding:3rem">Your cart is empty. <a href="/">Continue shopping →</a></p>';
          return;
        }
        root.innerHTML = c.map(function(i){
          return '<div style="display:flex;gap:1rem;padding:1rem 0;border-bottom:1px solid #eee"><img src="'+i.image+'" style="width:100px;height:100px;object-fit:cover;border-radius:var(--fb-radius)"><div style="flex:1"><div style="font-weight:600">'+i.name+'</div><div style="opacity:0.6;font-size:0.85rem">'+i.sku+'</div><div style="margin-top:0.5rem">'+i.qty+' × $'+i.price+'</div></div><div style="font-weight:700">$'+(i.qty*i.price).toFixed(2)+'</div></div>';
        }).join('');
        const total = c.reduce(function(s,i){return s+(i.price*i.qty);},0);
        root.innerHTML += '<div style="display:flex;justify-content:space-between;padding:1.5rem 0;font-size:1.25rem;font-weight:700"><span>Total</span><span>$'+total.toFixed(2)+'</span></div><button onclick="window.fbCart.checkout()" style="width:100%;padding:1rem;background:var(--fb-accent);color:var(--fb-on-accent);border:none;border-radius:var(--fb-radius);font-weight:700;font-size:1rem;cursor:pointer">Checkout</button>';
      });
    <\/script>
  </div>
</section>
</body>
</html>`;
}

function renderSitemap(
  project: Project,
  products: Awaited<ReturnType<typeof listProducts>>,
  collections: Awaited<ReturnType<typeof listCollections>>,
): string {
  const urls: string[] = [];
  for (const p of project.pages) {
    const slug = p.slug === '/' ? '/' : `/${p.slug.replace(/^\/+/, '').replace(/\/+$/, '')}/`;
    urls.push(slug);
  }
  for (const p of products) urls.push(`/products/${p.slug}/`);
  for (const c of collections) urls.push(`/collections/${c.handle}/`);
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).join('\n')}
</urlset>`;
}

export function renderSite(
  project: Project,
  sectionsMap: Map<string, Section>,
): RenderedSite {
  const files: RenderedSite['files'] = [];
  const theme = normalizeTheme(project.theme);
  const products = getCatalogProducts();
  const fullProducts = getFullProducts();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullProductsCache = new Map(fullProducts.map((p: any) => [p.slug, p]));
  const collections = getCollections();
  const fontsHref = googleFontsHref([theme.fontFamily, theme.headingFontFamily ?? '']);

  // CSS (base + theme variables)
  files.push({ path: 'assets/site.css', content: baseCss() + '\n' + themeCss(theme) });
  // Cart + client runtime
  files.push({ path: 'assets/cart.js', content: cartJs() });

  // Per-page HTML
  for (let i = 0; i < project.pages.length; i++) {
    const page = project.pages[i];
    const sections = page.sections
      .map((id) => sectionsMap.get(id))
      .filter((s): s is Section => Boolean(s));

    const body = sections.map((s) => renderSection(s, theme, products)).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(page.name)} — ${escape(project.name)}</title>
<meta name="description" content="${escape(project.description ?? '')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontsHref ? `<link href="${fontsHref}" rel="stylesheet">` : ''}
<link rel="stylesheet" href="/assets/site.css">
<script defer src="/assets/cart.js"><\/script>
</head>
<body>
${commonHeader(project, theme)}
${cartDrawer()}
${body}
<!-- Built with Forge Builder — ${new Date().toISOString()} -->
</body>
</html>`;

    const filePath = i === 0 || page.slug === '/' ? 'index.html' : `${page.slug.replace(/^\/+/, '').replace(/\/+$/, '') || page.id}/index.html`;
    files.push({ path: filePath, content: html });
  }

  // =======================================================
  // Dynamic: product detail pages — /products/{slug}/index.html
  // =======================================================
  for (const p of fullProducts) {
    files.push({
      path: `products/${p.slug}/index.html`,
      content: renderProductPage(project, theme, p, fontsHref),
    });
  }

  // =======================================================
  // Dynamic: collection pages — /collections/{handle}/index.html
  // =======================================================
  for (const c of collections) {
    let items: typeof fullProducts = [];
    try {
      items = productsInCollection(c.id) as typeof fullProducts;
    } catch {}
    files.push({
      path: `collections/${c.handle}/index.html`,
      content: renderCollectionPage(project, theme, c, items, fontsHref),
    });
  }

  // /cart/ page (client-side cart)
  files.push({
    path: 'cart/index.html',
    content: renderCartPage(project, theme, fontsHref),
  });

  // Manifest + robots + sitemap
  files.push({
    path: 'robots.txt',
    content: `User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n`,
  });
  files.push({
    path: 'sitemap.xml',
    content: renderSitemap(project, fullProducts, collections),
  });
  files.push({
    path: 'forge-builder.json',
    content: JSON.stringify(
      {
        project: { id: project.id, name: project.name, status: 'published' },
        generatedAt: new Date().toISOString(),
        pages: project.pages.map((p) => ({ id: p.id, name: p.name, slug: p.slug, sections: p.sections.length })),
        products: fullProducts.length,
        collections: collections.length,
      },
      null,
      2,
    ),
  });

  return { files };
}
