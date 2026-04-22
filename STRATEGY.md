# Forge Builder — Strategic Study

_Written 2026-04-22 by James Bro. Deep competitive analysis of Shopify and Wix Studio, honest assessment of Forge Builder, and a concrete roadmap._

---

## 1. What we actually built (honest baseline)

**Forge Builder today = a Shopify-_inspired_ section editor scaffold.** It has:

| Layer | State |
|---|---|
| 9 section types (hero, product grid, category, footer, etc.) | ✅ rendered in preview + static export |
| Drag-and-drop from library to page | ✅ basic |
| Inspector field types: text, textarea, image URL, color, toggle, select, number, array | ✅ works |
| Nested arrays (footer columns → links) | ✅ |
| Theme/brand kit (3 colours + font + logo) | ✅ live preview |
| Multi-page project (manifest + sections dict) | ✅ |
| Static HTML/CSS renderer | ✅ 9 section types, no JS runtime |
| Publish → GitHub push + Netlify deploy | ✅ end-to-end, ~12s |
| Preflight checks, progress UI, error capture | ✅ |
| File-based JSON storage (projects/ on external drive) | ✅ |
| macOS .app launcher | ✅ |

**Depth score (vs. a commercial page builder):** ~**15%**. The bones are solid but it's a scaffold — not yet a product.

---

## 2. Shopify (Liquid + Online Store 2.0) — what they got right

### The core mental model
Shopify's editor rests on four primitives that compose beautifully:

1. **Layouts** — the shell (`theme.liquid`): header/footer + `{{ content_for_layout }}`.
2. **Templates** — per page-type (home, product, collection, cart, article, page). JSON templates are _ordered section lists_ with optional settings overrides.
3. **Sections** — reusable modules with their own `{% schema %}` block. Schema defines `settings`, `blocks`, `presets`, and **which templates** they're allowed on (`enabled_on` / `disabled_on`).
4. **Blocks** — three kinds: **Section blocks** (scoped, no nesting), **Theme blocks** (shared, nestable, reusable across sections), **App blocks** (injected by installed apps). A section can nest up to **50 blocks**, and JSON templates render up to 25 sections.

**Why this is brilliant:** merchants can add/remove/reorder sections on _any_ page, and blocks inside sections, without ever touching code. Apps can inject into any section that declares `"blocks": [{"type": "@app"}]`.

### Input settings — the secret sauce
Shopify's schema has **28 input setting types**, split into:

**Basic (7):** `checkbox`, `number`, `radio`, `range`, `select`, `text`, `textarea`

**Specialised (21) — _this is where we're weakest_:**
- Content pickers: `article`, `blog`, `page`, `product`, `product_list`, `collection`, `collection_list`, `metaobject`, `metaobject_list`
- Media: `image_picker`, `video`, `video_url`
- Rich: `richtext`, `inline_richtext`, `html`, `liquid`
- Design: `color`, `color_background`, `color_scheme`, `color_scheme_group`, `font_picker`, `text_alignment`
- Navigation: `link_list`, `url`

**Every specialised setting is CMS-aware.** A `product` picker shows a real product search UI. A `color_scheme` references a theme-level palette, not a raw hex — so global theme updates cascade.

### Sections everywhere + section groups
Post-"Online Store 2.0" (2022), the **header and footer are section groups** — merchants can add dropdowns, announcement bars, language pickers etc. by dragging blocks. No page is "locked".

### Metafields + metaobjects (the real CMS)
Shopify isn't just an e-commerce engine; every product, collection, customer, and order has arbitrary `metafields`. `metaobjects` are custom content types merchants define (e.g. "Author", "Ingredient", "Showroom Location"). Themes can pick/render these via `metaobject`/`metaobject_list` inputs.

### What merchants see
- Left: page picker + section tree
- Centre: live preview iframe
- Right: section inspector with typed inputs
- Top: theme publish / preview / diff

Sound familiar? It should — this is exactly our three-panel layout. But ours is the silhouette of the idea. Shopify's is the fully-furnished room.

---

## 3. Wix Studio — what they got right

Wix Studio (the pro agency tool, launched 2023) is a different beast: **freeform canvas + responsive breakpoint system + CMS + Velo IDE**.

### 1. Breakpoint-first responsive design
Wix Studio's editor has **fluid breakpoints** — you design on a canvas and the editor automatically generates CSS for 4+ viewport sizes. You can override per-breakpoint (font size smaller on mobile, stack instead of grid, etc.) but defaults cascade intelligently.

**Shopify doesn't have this** — Shopify themes are mobile-responsive via developer-written CSS, not merchant-visible in the editor. Wix wins here for agency use.

### 2. Wix CMS (Content Collections)
Non-developers create typed collections ("Products", "Blog Posts", "Team Members"):
- Typed fields: Text, Rich Text, Number, Boolean, Date, Image, Gallery, URL, Reference, Multi-Reference, Tags, Address, Document, Video, Color
- Dynamic pages: create a collection → auto-generate `/products/{slug}` pages from a template
- Queryable via Velo (`wix-data` API — `query()`, `aggregate()`, `filter()`, `sort()`, hooks)

This is **dramatically more flexible than Shopify's product-only catalog**. Anything can be a collection.

### 3. Velo (Wix's code layer)
JavaScript/Node runtime built into the editor. You can:
- Add event handlers to any element (`$w('#button1').onClick(…)`)
- Query the database
- Call external APIs with `wix-fetch`
- Build HTTP functions that become real endpoints
- Use npm packages

### 4. Master pages & design system
One "master page" controls header/nav/footer across the whole site. Design tokens (colours, text styles, spacing scale) cascade globally — rename "Primary" once, everything updates.

### 5. Interactions & animations
Wix has a visual animations panel: scroll triggers, hover states, entrance/exit, timelines. Shopify leaves this entirely to theme CSS.

---

## 4. Honest gap analysis: Forge Builder vs. the big boys

### Critical gaps (MUST fix to be taken seriously)

| # | Gap | Severity | Effort |
|---|---|---|---|
| 1 | **No product catalog CMS** — we ship a static JSON of 38 products. Not managed, not searchable, not editable in-app. | 🔴 blocking | Large |
| 2 | **No blocks** — every section is monolithic. Can't add/remove sub-items inside a hero, product card, etc. | 🔴 blocking | Medium |
| 3 | **No dynamic pages** — no `/products/{slug}`, no `/collections/{slug}`. A "Shop" page renders the same product list for everyone. | 🔴 blocking | Medium |
| 4 | **No theme templates** — home, product, collection, cart, account all need distinct templates with different default sections. | 🔴 blocking | Medium |
| 5 | **No image upload** — `image_picker` is a raw URL field. No asset library, no resize, no CDN. | 🔴 major | Medium |
| 6 | **No rich text editor** — we ship `<textarea>` + HTML. Merchants expect WYSIWYG. | 🔴 major | Medium |
| 7 | **No color schemes** — we have 3 raw hex inputs. Shopify/Wix have reusable palettes that cascade. | 🟡 important | Small |
| 8 | **No breakpoint-specific overrides** — everything is single-layout. Preview device switcher is cosmetic. | 🟡 important | Large |
| 9 | **No font picker with Google Fonts preview** — we have a `<select>` of 8 font names. | 🟡 important | Small |
| 10 | **No undo/redo** — one misclick = lost work. | 🔴 major | Small |
| 11 | **No autosave** — we save on button press or never. | 🔴 major | Small |
| 12 | **No revisions / version history** — can't roll back. | 🟡 important | Medium |
| 13 | **No preview for unpublished state vs. published** — user can't see "what's live vs. what's staged". | 🟡 important | Small |
| 14 | **No multi-user / collaboration** — one human, one localhost. | 🟢 later | Huge |
| 15 | **No SEO editor per page** — we auto-generate `<title>`/`<meta>` but merchants can't edit. | 🔴 major | Small |
| 16 | **No forms** — newsletter section has a fake `onsubmit="alert(…)"`. No form submissions, no email capture, no integrations. | 🔴 major | Medium |
| 17 | **No checkout / payments** — we're not e-commerce yet. We render product cards that go to `href="#"`. | 🔴 blocking if we want commerce | Huge |
| 18 | **No app extensibility** — no way for third parties to add section/block types. | 🟢 later | Large |
| 19 | **No theme settings beyond brand kit** — no global layout width, spacing scale, border radius, animation speeds. | 🟡 important | Small |
| 20 | **Drag-and-drop is single-direction** (library → page). Can't drag to reorder inside the canvas itself (only in PageTree). | 🟡 important | Small |

### Quality-of-life gaps

| Gap | Why it matters |
|---|---|
| No keyboard shortcuts (`⌘S`, `⌘Z`, `⌘⏎ publish`) | Pros live on shortcuts |
| No duplicate section | Merchants build by cloning |
| No section templates / presets | Shopify sections have `presets: []` — same section, different default settings |
| No page templates | Currently every new page is blank |
| No global search (⌘K) | Can't jump to any section/page fast |
| No onboarding tour | First-run UX is "nothing to see here" |
| No error boundaries | If a section throws, builder crashes |
| No section thumbnails | Library is a text list |
| Inspector has no "reset to default" | Once edited, can't undo a single field |

---

## 5. The product catalog question — "can we professionally manage it?"

**Short answer: No, not yet. But we can, and here's exactly how.**

### What we have today
- `src/data/catalog.json` — static, committed to repo, 38 products, 9 fields per product
- `/api/catalog` — GET only, no auth, returns the file
- No admin UI. To change a product: edit JSON, redeploy.

### What a professional catalog needs (minimum bar)

**1. Data model (at least Shopify-parity)**
```ts
Product {
  id, sku, handle/slug, title, description (rich text),
  vendor, productType, tags[],
  status: draft | active | archived,
  publishedAt, createdAt, updatedAt,
  images: ProductImage[],  // with alt, position, src, cdn variants
  variants: ProductVariant[], // size, colour, etc.
  options: ProductOption[], // option1/2/3 → variants
  seo: { title, description, slug },
  metafields: Record<string, any>,  // custom fields
  collections: Collection[],        // many-to-many
}

ProductVariant {
  id, sku, title, price, compareAtPrice,
  inventoryQuantity, inventoryPolicy (deny | continue),
  weight, weightUnit, barcode, requiresShipping,
  option1, option2, option3, // e.g. "Gold" / "18\""  / "Small"
  image, position
}

Collection {
  id, handle/slug, title, description, image,
  type: manual | smart,
  rules?: [{ field, op, value }],  // smart collection rules
  sortOrder, products[]
}
```

**2. Storage layer**
Three options, roughly in order of effort:

| Option | Pros | Cons |
|---|---|---|
| **SQLite** via better-sqlite3 | Instant, zero-config, perfect for file-based storage. Runs inside Next.js route handlers. | Single-writer, no remote. |
| **Postgres (Supabase / Neon)** | Scales, real-time, row-level auth, image CDN via Supabase Storage. | External dep, token to manage. |
| **Shopify Admin API** as the backing store | Free professional product management UI, variants/inventory/payments/shipping all solved. | We become a Shopify storefront front-end, not an independent product. |

**My recommendation: start with SQLite, add Supabase migration path.** Rationale:
- SQLite stays on the external drive alongside project storage
- One schema migration tool (e.g. `drizzle-kit`) moves us to Postgres later with one config change
- No auth complexity while you're the only user
- Image storage can stay on-filesystem in `/Volumes/Iron 1TBSSD/Apps/ForgeBuilder/media/` and be served by a `/api/media/[id]` route

**3. Admin UI — a real /admin/products page**
Not in the page-builder — a separate route.
- Table with search / filter / sort / bulk edit
- Drawer form with rich text, variant matrix, drag-drop image upload
- CSV import/export
- Inventory view (low stock alerts)
- "Duplicate", "Archive", "Delete"

**4. Content pickers in the builder**
When a section has a `product` input, merchants click → modal with live catalog search → pick one. Not a freeform slug field like today. Matches Shopify.

**5. Collection / smart-collection engine**
Merchants define "Gold necklaces under $200" as a smart collection rule (`category=necklaces AND materials CONTAINS "Gold" AND price<200`). Product Grid section can target a collection, not a hardcoded slug list.

**6. Public storefront API**
The published static site needs `/products/{slug}` and `/collections/{slug}` pages. These become dynamic templates rendered at publish time (for static export) or at request time (if we add SSR).

**7. Stock / inventory**
At minimum, "In stock" / "Out of stock" per variant. Later: quantity, low-stock thresholds, reservations during checkout.

---

## 6. Roadmap — pragmatic, staged

**Ship-order, not wish-list.** Each stage is independently valuable and builds on the last.

### 🟦 Phase 1 — "Catalog parity" (2–3 focused sessions)
_Make it a real e-commerce builder._
1. **SQLite + Drizzle** — add `sqlite` package, define `Product`, `ProductVariant`, `ProductImage`, `Collection` schemas
2. **Admin UI** at `/admin/catalog` — table + drawer form (shadcn `DataTable` + `Sheet`)
3. **Image upload** — multipart POST → `/Volumes/Iron 1TBSSD/Apps/ForgeBuilder/media/` + thumb generation (sharp)
4. **Rich text editor** — integrate Tiptap for descriptions
5. **Product picker modal** in the Inspector (replaces the array-of-slugs field)
6. **Seed the catalog** — import the 85 Forge products from `productsData.ts` on first boot
7. **Static export includes `/products/{slug}/index.html` per product** + `/collections/{handle}/index.html`

### 🟦 Phase 2 — "Professional editing" (1–2 sessions)
_Match Shopify's feel._
1. **Theme blocks** — introduce a `Block` primitive, sections can accept typed blocks, blocks can nest
2. **Color schemes** — named palettes (`primary`, `secondary`, `surface`, `on-surface`); sections reference scheme names, not raw hex
3. **Font picker** with live Google Fonts preview (use `<link rel=stylesheet>` + small metadata file)
4. **Undo/redo** via zustand middleware (persist history)
5. **Autosave** — debounced PUT after 1.5s idle
6. **Keyboard shortcuts** — `⌘S`, `⌘Z`, `⌘⇧Z`, `⌘K`, `⌘⏎`
7. **Duplicate section/page** + **section presets**
8. **Inspector "reset to default"** per field
9. **SEO per page** (`<title>`, meta description, canonical, OG image)

### 🟦 Phase 3 — "Dynamic site" (2–3 sessions)
_Make the published site actually powered by the catalog._
1. **Templates layer** — `home`, `product`, `collection`, `cart`, `page` templates (like Shopify)
2. **Dynamic page routing** at static build — one template → N output pages
3. **Collection pages** with real pagination + filtering (category, price, tag)
4. **Cart** (client-side localStorage cart → submit to checkout provider)
5. **Checkout** — Stripe Checkout session (we have stripe skill) or Shopify Buy SDK if we stay frontend
6. **Forms** — real newsletter/contact submissions to a configurable webhook or email service
7. **Product variants UI** on product page

### 🟦 Phase 4 — "Pro design" (2–3 sessions)
_Wix Studio-level polish._
1. **Breakpoint overrides** — mobile-specific settings per section (columns=2 on mobile, 4 on desktop)
2. **Section animations** — scroll triggers, entrance effects (Framer Motion variants in the renderer)
3. **Global design tokens** — spacing scale, border radius, shadow scale applied via CSS custom properties
4. **Master layout** — shared header/footer across pages (like Shopify section groups)
5. **Revision history** — every publish = git commit, list view + 1-click rollback (we already have the git worktree!)

### 🟦 Phase 5 — "Platform" (open-ended)
_Multi-tenant, collaborative, extensible._
1. Auth (NextAuth + magic link or GitHub OAuth)
2. Postgres migration (Supabase)
3. Multi-user projects with roles (owner, editor, viewer)
4. App/plugin system — third-party section types
5. Hosted SaaS mode (not just localhost)
6. Marketplace: sell themes, sections, templates

---

## 7. What I'd ship next if I had to pick one thing

**Phase 1 item 1–5 (catalog + picker + rich text).** Here's why:

- It's the **highest-value gap**: the app is branded "Forge" (a jewellery brand) and can't even manage jewellery professionally. That's embarrassing.
- It unlocks Phase 3 (dynamic pages) which is the actual product people pay Shopify $39–$400/mo for.
- It's scoped: ~1 focused session gets us to a working admin CRUD. ~2 more for images + variants + picker.
- It's **differentiated**: if we ship a catalog that's SQLite-first and 100% local/portable (copy the file = backup the store), that's a feature Shopify literally cannot offer.

**Tech stack for Phase 1:**
- **Database:** `better-sqlite3` + Drizzle ORM (typesafe, codegen, future-Postgres-friendly)
- **Image handling:** `sharp` for thumbs + webp conversion
- **Rich text:** `@tiptap/react` + `@tiptap/starter-kit`
- **File uploads:** Next.js route handler with `formData()` → write to `media/` dir
- **Admin UI:** shadcn `DataTable` + `Sheet` + `Form` + `Dialog`
- **Image CDN:** dev = `/api/media/:id`; publish = copy to export + rewrite URLs

Estimated delivery: **~2 hours** of focused building to get CRUD + image upload + picker + seeded catalog live.

---

## 8. Is our builder comprehensive enough?

**For a weekend tech demo: yes, it's impressive.** We built it from a broken scaffold to a deployed site in under 3 hours.

**For real merchants: no.** Missing: catalog CMS, rich text, image upload, undo, autosave, responsive breakpoints, forms, checkout. Those aren't nice-to-haves — they're entry-level requirements.

**Can we get there?** Yes, and the foundation we have is actually very sound — Zustand state, file-based JSON projects, clean renderer, resilient publish pipeline. The architecture is Shopify-ish and it's paying off. We just need to fill in the room.

**What we have that Shopify/Wix don't:**
- **Portable storage**: SQLite file + project JSON + published static files = drop it on any drive, run the .app, instantly resumable. No vendor lock-in.
- **Git-native publish**: every publish is a commit. Rollback = `git reset`. No paid plan required.
- **Local-first**: no login walls, no usage limits, no "upgrade to Plus to use this feature". The whole app runs from a USB drive if the external's plugged in.

Those are the seeds of a real differentiation story.

---

## 9. Decision needed

Pick your next move:

**A.** Phase 1 catalog CMS (highest ROI, ~2 hours)
**B.** Phase 2 professional polish first (undo/autosave/color-schemes, ~1.5 hours)
**C.** Phase 3 dynamic pages first (requires A, so really A+C combined)
**D.** Something I haven't flagged — tell me what matters most to you

I'd vote **A**, but happy to do any of them.
