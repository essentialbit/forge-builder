"use client";

import { useEffect, useState } from "react";
import { Section } from "@/types/builder";
import { sectionRegistry } from "@/lib/section-registry";

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

type Catalog = {
  products: CatalogProduct[];
  categories: string[];
};

let catalogCache: Catalog | null = null;
let catalogPromise: Promise<Catalog> | null = null;

async function fetchCatalog(): Promise<Catalog> {
  if (catalogCache) return catalogCache;
  if (!catalogPromise) {
    catalogPromise = fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : { products: [], categories: [] }))
      .then((c: Catalog) => {
        catalogCache = c;
        return c;
      })
      .catch(() => ({ products: [], categories: [] }));
  }
  return catalogPromise;
}

function useCatalog(): Catalog {
  const [cat, setCat] = useState<Catalog>(catalogCache ?? { products: [], categories: [] });
  useEffect(() => {
    if (catalogCache) return;
    let cancelled = false;
    fetchCatalog().then((c) => {
      if (!cancelled) setCat(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return cat;
}

function formatAUD(v: number): string {
  return "$" + v.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

type Theme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logo: string;
};

interface SectionRendererProps {
  section: Section;
  theme?: Theme;
  isEditing?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
}

export function SectionRenderer({
  section,
  theme = {
    primaryColor: "#D4AF37",
    secondaryColor: "#0a0a0a",
    accentColor: "#ffffff",
    fontFamily: "Inter",
    logo: "",
  },
  isEditing = false,
  onSelect,
  isSelected = false,
}: SectionRendererProps) {
  const catalog = useCatalog();
  const settings = section.settings;

  switch (section.type) {
    case "hero":
      return <HeroSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "announcement":
      return <AnnouncementSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "product-grid":
      return <ProductGridSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "category-showcase":
      return <CategoryShowcaseSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "rich-text":
      return <RichTextSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "image-block":
      return <ImageBlockSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "trust-badges":
      return <TrustBadgesSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "newsletter":
      return <NewsletterSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "footer":
      return <FooterSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "faq":
      return <FaqSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "featured_product":
      return <FeaturedProductSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "testimonials":
      return <TestimonialsSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "spacer":
      return <div onClick={onSelect} style={{ height: (settings.height as number) || 80 }} className={`${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`} />;

    // ── New section types ─────────────────────────────────────────────────────
    case "featured-products":
      return <FeaturedProductsSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} catalog={catalog} />;
    case "video-hero":
      return <VideoHeroSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "countdown-timer":
      return <CountdownTimerSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "comparison-table":
      return <ComparisonTableSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "payment-badges":
      return <PaymentBadgesSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "product-detail-hero":
      return <ProductDetailHeroSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} catalog={catalog} />;
    case "collection-hero":
      return <CollectionHeroSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} catalog={catalog} />;
    case "ring-size-guide":
      return <RingSizeGuideSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "account-dashboard":
      return <AccountDashboardSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "new-arrivals":
      return <NewArrivalsSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} catalog={catalog} />;
    case "promo-banner":
      return <PromoBannerSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "savings-strip":
      return <SavingsStripSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "moissanite-showcase":
      return <MoissaniteShowcaseSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} catalog={catalog} />;
    case "category-copy-editor":
      return <CategoryCopyEditorSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;
    case "product-badge-settings":
      return <ProductBadgeSettingsSection settings={settings} theme={theme} isEditing={isEditing} onSelect={onSelect} isSelected={isSelected} />;

    default:
      return (
        <div className="p-8 bg-slate-100 text-center text-slate-500">
          Unknown section type: {section.type}
        </div>
      );
  }
}

// Section Components
interface SectionProps {
  settings: Record<string, unknown>;
  theme: Theme;
  isEditing: boolean;
  onSelect?: () => void;
  isSelected: boolean;
  catalog?: Catalog;
}

function HeroSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const headline = (settings.headline as string) || "Hero Headline";
  const subheadline = (settings.subheadline as string) || "Your subheadline here";
  const ctaText = (settings.cta_text as string) || "Shop Now";
  const ctaLink = (settings.cta_link as string) || "/shop";
  const bgImage = (settings.background_image_url as string) || "";
  const overlayOpacity = ((settings.overlay_opacity as number) || 50) / 100;
  const textAlign = (settings.text_alignment as string) || "center";

  return (
    <section
      onClick={onSelect}
      className={`relative min-h-[500px] flex items-center justify-center overflow-hidden ${
        isEditing ? "cursor-pointer" : ""
      } ${isSelected ? "ring-2 ring-amber-500 ring-offset-2" : ""}`}
      style={{
        backgroundColor: (settings.background_color as string) || "#000",
      }}
    >
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity || 0.5 }}
      />
      <div className={`relative z-10 max-w-3xl mx-auto px-6 text-${textAlign}`}>
        <h1
          className="text-5xl md:text-6xl font-bold mb-4"
          style={{ color: (settings.text_color as string) || "#fff", fontFamily: theme.fontFamily }}
        >
          {headline}
        </h1>
        <p
          className="text-xl md:text-2xl mb-8 opacity-90"
          style={{ color: (settings.text_color as string) || "#fff" }}
        >
          {subheadline}
        </p>
        <a
          href={ctaLink}
          className="inline-block px-8 py-4 rounded-lg text-lg font-semibold transition-transform hover:scale-105"
          style={{ backgroundColor: theme.primaryColor, color: theme.secondaryColor }}
        >
          {ctaText}
        </a>
      </div>
    </section>
  );
}

function AnnouncementSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const text = (settings.text as string) || "Announcement text";
  const link = (settings.link as string) || "";
  const bgColor = (settings.background_color as string) || theme.primaryColor;
  const textColor = (settings.text_color as string) || theme.secondaryColor;

  return (
    <div
      onClick={onSelect}
      className={`py-3 px-4 ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-7xl mx-auto text-center">
        {link ? (
          <a href={link} style={{ color: textColor }} className="text-sm font-medium hover:underline">
            {text}
          </a>
        ) : (
          <span style={{ color: textColor }} className="text-sm font-medium">{text}</span>
        )}
      </div>
    </div>
  );
}

function ProductGridSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const title = (settings.title as string) || "Featured Products";
  const subtitle = (settings.subtitle as string) || "";
  const columns = Math.max(1, Math.min(5, (settings.columns as number) || 3));
  const productSlugs = Array.isArray(settings.product_slugs) ? (settings.product_slugs as string[]) : [];
  const showPrices = settings.show_prices !== false;
  const showAddToCart = settings.show_add_to_cart !== false;

  const catalog = useCatalog();

  // Resolve products: by slug if provided, else top-N from catalog
  let products: CatalogProduct[] = [];
  if (productSlugs.length > 0) {
    const bySlug = new Map(catalog.products.map((p) => [p.slug, p] as const));
    const bySku = new Map(catalog.products.map((p) => [p.sku.toLowerCase(), p] as const));
    products = productSlugs
      .map((s) => bySlug.get(s) ?? bySku.get(s.toLowerCase()))
      .filter((p): p is CatalogProduct => Boolean(p));
  }
  if (products.length === 0) {
    products = catalog.products.slice(0, columns * 2);
  }

  return (
    <section
      onClick={onSelect}
      className={`py-16 px-6 ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`}
      style={{ backgroundColor: theme.secondaryColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg opacity-70" style={{ color: theme.accentColor }}>
              {subtitle}
            </p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 opacity-60" style={{ color: theme.accentColor }}>
            No products to display.
          </div>
        ) : (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {products.slice(0, columns * 2).map((product) => (
              <div
                key={product.sku}
                className="rounded-xl overflow-hidden flex flex-col"
                style={{ backgroundColor: theme.accentColor }}
              >
                <div className="aspect-square bg-slate-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0.3";
                    }}
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-sm line-clamp-2" style={{ color: theme.secondaryColor }}>
                    {product.name}
                  </h3>
                  {showPrices && (
                    <div className="flex items-baseline gap-2 mt-2">
                      <p className="text-lg font-bold" style={{ color: theme.primaryColor }}>
                        {formatAUD(product.price)}
                      </p>
                      {product.compare_price && product.compare_price > product.price && (
                        <p className="text-xs line-through opacity-50" style={{ color: theme.secondaryColor }}>
                          {formatAUD(product.compare_price)}
                        </p>
                      )}
                    </div>
                  )}
                  {showAddToCart && (
                    <button
                      className="mt-auto pt-3 text-xs font-semibold uppercase tracking-wider hover:underline self-start"
                      style={{ color: theme.primaryColor }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Add to cart →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CategoryShowcaseSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const title = (settings.title as string) || "Shop by Category";
  const subtitle = (settings.subtitle as string) || "";
  const categorySlugs = Array.isArray(settings.category_slugs)
    ? (settings.category_slugs as string[])
    : ["rings", "necklaces", "bracelets", "earrings"];

  const catalog = useCatalog();

  // Pick the top-scoring product image per category as the tile
  const categoryData = categorySlugs.map((slug) => {
    const sample = catalog.products.find((p) => p.category.toLowerCase() === slug.toLowerCase());
    return {
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      image: sample?.image ?? `https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80`,
    };
  });

  return (
    <section
      onClick={onSelect}
      className={`py-16 px-6 ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`}
      style={{ backgroundColor: theme.secondaryColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg opacity-70" style={{ color: theme.accentColor }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryData.map((cat) => (
            <a
              key={cat.slug}
              href={`/collections/${cat.slug}`}
              className="group relative aspect-square rounded-xl overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-lg font-semibold text-white">{cat.name}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function RichTextSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const content = (settings.content as string) || "<p>Add your content here...</p>";
  const maxWidth = (settings.max_width as number) || 800;
  const textAlign = ((settings.text_alignment as string) || "left") as React.CSSProperties["textAlign"];

  return (
    <section
      onClick={onSelect}
      className={`py-12 px-6 ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`}
      style={{ backgroundColor: theme.accentColor }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: `${maxWidth}px`,
          textAlign,
          fontFamily: theme.fontFamily,
          color: theme.secondaryColor,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}

function ImageBlockSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const imageUrl = (settings.image_url as string) || "";
  const altText = (settings.alt_text as string) || "";
  const linkUrl = (settings.link_url as string) || "";
  const caption = (settings.caption as string) || "";

  const content = (
    <div onClick={onSelect} className={`w-full ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`}>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={altText} className="w-full h-auto" />
      )}
      {caption && (
        <p className="text-center text-sm mt-2 opacity-60" style={{ color: theme.secondaryColor }}>
          {caption}
        </p>
      )}
    </div>
  );

  return linkUrl ? <a href={linkUrl}>{content}</a> : content;
}

function TrustBadgesSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const badges = (settings.badges as Array<{ icon: string; label: string; link: string }>) || [
    { icon: "ShieldCheck", label: "Secure Checkout", link: "/security" },
    { icon: "Truck", label: "Free Shipping", link: "/shipping" },
    { icon: "RefreshCw", label: "30-Day Returns", link: "/returns" },
    { icon: "Headphones", label: "24/7 Support", link: "/support" },
  ];

  return (
    <section
      onClick={onSelect}
      className={`py-8 px-6 border-t border-b ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`}
      style={{ backgroundColor: theme.accentColor }}
    >
      <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8">
        {badges.map((badge, i) => (
          <a
            key={i}
            href={badge.link}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: theme.secondaryColor }}
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full opacity-70">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </span>
            {badge.label}
          </a>
        ))}
      </div>
    </section>
  );
}

function NewsletterSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const heading = (settings.heading as string) || "Join the Club";
  const description = (settings.description as string) || "Get exclusive access to new arrivals, promotions, and more.";
  const buttonText = (settings.button_text as string) || "Subscribe";

  return (
    <section
      onClick={onSelect}
      className={`py-16 px-6 ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`}
      style={{ backgroundColor: theme.primaryColor }}
    >
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: theme.secondaryColor, fontFamily: theme.fontFamily }}>
          {heading}
        </h2>
        <p className="mb-6" style={{ color: theme.secondaryColor, opacity: 0.8 }}>
          {description}
        </p>
        <form className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-2.5 rounded-lg border-0"
            style={{ backgroundColor: theme.secondaryColor, color: theme.accentColor }}
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: theme.secondaryColor, color: theme.primaryColor }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}

function FooterSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const columns = (settings.columns as Array<{ heading: string; links: Array<{ label: string; url: string }> }>) || [];
  const copyrightText = (settings.copyright_text as string) || "© 2026 Forge Jewellery. All rights reserved.";
  const socialLinks = (settings.social_links as Array<{ label: string; url: string }>) || [];

  return (
    <footer
      onClick={onSelect}
      className={`py-12 px-6 ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`}
      style={{ backgroundColor: theme.secondaryColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="font-semibold mb-4" style={{ color: theme.accentColor }}>
                {col.heading}
              </h4>
              <ul className="space-y-2">
                {col.links?.map((link, j) => (
                  <li key={j}>
                    <a
                      href={link.url}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                      style={{ color: theme.accentColor }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm opacity-50" style={{ color: theme.accentColor }}>
            {copyrightText}
          </p>
          <div className="flex gap-4">
            {socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: theme.accentColor }}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FaqSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const title = (settings.title as string) || "FAQ";
  const subtitle = (settings.subtitle as string) || "";
  const items = Array.isArray(settings.items) ? (settings.items as Array<{ question?: string; answer?: string }>) : [];
  return (
    <section
      onClick={onSelect}
      className={`py-16 px-6 ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`}
      style={{ backgroundColor: theme.accentColor, color: theme.secondaryColor }}
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: theme.fontFamily }}>{title}</h2>
        {subtitle && <p className="text-center opacity-70 mb-8">{subtitle}</p>}
        <div className="space-y-1">
          {items.map((it, i) => (
            <details key={i} className="border-b border-black/10 py-4" open={i === 0}>
              <summary className="font-semibold cursor-pointer">{it.question ?? ""}</summary>
              <p className="mt-2 opacity-80">{it.answer ?? ""}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProductSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const slugs = Array.isArray(settings.product_slugs) ? (settings.product_slugs as string[]) : [];
  const showDesc = settings.show_description !== false;
  const layout = String(settings.layout ?? "split");
  const catalog = useCatalog();
  const product = slugs.length > 0 ? catalog.products.find((p) => p.slug === slugs[0] || p.sku.toLowerCase() === slugs[0].toLowerCase()) : catalog.products[0];
  if (!product) {
    return (
      <section onClick={onSelect} className={`py-16 px-6 text-center opacity-60 ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`} style={{ backgroundColor: theme.secondaryColor, color: theme.accentColor }}>
        Pick a product for this section
      </section>
    );
  }
  const flip = layout === "split-reverse";
  return (
    <section onClick={onSelect} className={`py-16 px-6 ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`} style={{ backgroundColor: theme.accentColor }}>
      <div className={`max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 ${flip ? "md:flex-row-reverse" : ""}`}>
        <div className={flip ? "md:order-2" : ""}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} className="w-full rounded-lg" style={{ background: "#f5f5f5" }} />
        </div>
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-3" style={{ color: theme.secondaryColor, fontFamily: theme.fontFamily }}>{product.name}</h2>
          <p className="text-xl font-bold mb-4" style={{ color: theme.primaryColor }}>{formatAUD(product.price)}</p>
          {showDesc && product.materials && <p className="mb-6 opacity-80" style={{ color: theme.secondaryColor }}>{product.materials}</p>}
          <button className="px-6 py-3 rounded-md font-semibold self-start" style={{ background: theme.primaryColor, color: theme.secondaryColor }}>
            Add to cart
          </button>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const title = (settings.title as string) || "What our customers say";
  const items = Array.isArray(settings.items) ? (settings.items as Array<{ quote?: string; author?: string; rating?: number }>) : [];
  return (
    <section onClick={onSelect} className={`py-16 px-6 ${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500" : ""}`} style={{ backgroundColor: theme.secondaryColor, color: theme.accentColor }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10" style={{ fontFamily: theme.fontFamily }}>{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <figure key={i} className="bg-white rounded-lg p-6 text-slate-900 shadow">
              <div className="text-amber-500 mb-2">{"★".repeat(Math.max(1, Math.min(5, Number(t.rating ?? 5))))}</div>
              <blockquote className="italic mb-3">“{t.quote ?? ""}”</blockquote>
              <figcaption className="text-sm opacity-60">— {t.author ?? ""}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── New section renderers ─────────────────────────────────────────────────────

function sel(isEditing: boolean, isSelected: boolean) {
  return `${isEditing ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-amber-500 ring-inset" : ""}`;
}

function FeaturedProductsSection({ settings, theme, isEditing, onSelect, isSelected, catalog }: SectionProps) {
  const eyebrow  = (settings.eyebrow as string)  || "Staff Picks";
  const title    = (settings.title as string)    || "Hand-Picked For You";
  const columns  = Number(settings.columns) || 4;
  const products = catalog?.products.slice(0, columns) ?? [];
  return (
    <section onClick={onSelect} className={`py-16 px-6 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: theme.secondaryColor }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-center mb-1" style={{ color: theme.primaryColor }}>{eyebrow}</p>
        <h2 className="text-3xl font-bold text-center mb-10" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>{title}</h2>
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)` }}>
          {products.length > 0 ? products.map(p => (
            <div key={p.sku} className="rounded-lg overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
              <div className="aspect-square bg-slate-800 flex items-center justify-center">
                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-80" /> : <span className="text-slate-500 text-xs">No image</span>}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium truncate" style={{ color: theme.accentColor }}>{p.name}</p>
                <p className="text-sm font-bold mt-1" style={{ color: theme.primaryColor }}>{formatAUD(p.price)}</p>
              </div>
            </div>
          )) : Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden bg-slate-800 aspect-square flex items-center justify-center">
              <span className="text-slate-500 text-xs">Product {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoHeroSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const headline    = (settings.headline as string)    || "Crafted for Those Who Stand Out";
  const subheadline = (settings.subheadline as string) || "Premium jewellery. Uncompromising quality.";
  const ctaText     = (settings.cta_text as string)   || "Shop Now";
  const poster      = (settings.poster_image as string) || "";
  const overlay     = Number(settings.overlay_opacity || 40) / 100;
  const heights: Record<string, string> = { small: "300px", medium: "450px", large: "560px", full: "80vh" };
  const height = heights[(settings.height as string) || "large"] || "560px";
  return (
    <section onClick={onSelect} className={`relative flex items-center justify-center overflow-hidden ${sel(isEditing, isSelected)}`} style={{ minHeight: height }}>
      {poster
        ? <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : <div className="absolute inset-0 bg-slate-800 flex items-center justify-center"><span className="text-slate-500 text-sm">▶ Video background</span></div>
      }
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
      <div className="relative text-center px-6 z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>{headline}</h1>
        <p className="text-lg mb-8 opacity-80" style={{ color: theme.accentColor }}>{subheadline}</p>
        <button className="px-8 py-3 font-semibold rounded-sm" style={{ background: theme.primaryColor, color: theme.secondaryColor }}>{ctaText}</button>
      </div>
    </section>
  );
}

function CountdownTimerSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const title    = (settings.title as string)    || "Sale Ends In";
  const subtitle = (settings.subtitle as string) || "Limited stock — don't miss out";
  const bg       = (settings.background_color as string) || "#111111";
  const accent   = (settings.accent_color as string)     || theme.primaryColor;
  return (
    <section onClick={onSelect} className={`py-12 px-6 text-center ${sel(isEditing, isSelected)}`} style={{ backgroundColor: bg }}>
      <h2 className="text-2xl font-bold mb-2 text-white">{title}</h2>
      <p className="text-sm mb-6 opacity-60 text-white">{subtitle}</p>
      <div className="flex justify-center gap-4">
        {["00", "12", "34", "56"].map((n, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-4xl font-mono font-bold px-4 py-3 rounded-sm min-w-[64px]" style={{ backgroundColor: accent, color: bg }}>{n}</span>
            <span className="text-xs mt-1 uppercase tracking-widest opacity-60 text-white">{["Days","Hrs","Min","Sec"][i]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparisonTableSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const title    = (settings.title as string)     || "Why Choose Us?";
  const subtitle = (settings.subtitle as string)  || "";
  const usLabel  = (settings.us_label as string)  || "Us";
  const themLabel = (settings.them_label as string) || "Others";
  const rows = Array.isArray(settings.items)
    ? (settings.items as Array<{ feature?: string; us_value?: string; them_value?: string }>)
    : [
        { feature: "Quality", us_value: "✓ Premium", them_value: "✗ Variable" },
        { feature: "Certifications", us_value: "✓ GRA Certified", them_value: "✗ Often missing" },
        { feature: "Returns", us_value: "✓ 30 days", them_value: "? Varies" },
      ];
  return (
    <section onClick={onSelect} className={`py-16 px-6 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: theme.secondaryColor }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>{title}</h2>
        {subtitle && <p className="text-center mb-8 opacity-60" style={{ color: theme.accentColor }}>{subtitle}</p>}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="py-3 text-left opacity-60" style={{ color: theme.accentColor }}>Feature</th>
              <th className="py-3 text-center font-bold" style={{ color: theme.primaryColor }}>{usLabel}</th>
              <th className="py-3 text-center opacity-50" style={{ color: theme.accentColor }}>{themLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <td className="py-3 text-sm" style={{ color: theme.accentColor }}>{row.feature}</td>
                <td className="py-3 text-center text-sm font-semibold" style={{ color: theme.primaryColor }}>{row.us_value}</td>
                <td className="py-3 text-center text-sm opacity-50" style={{ color: theme.accentColor }}>{row.them_value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PaymentBadgesSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const title = (settings.title as string) || "Safe & Secure Checkout";
  const methods = [
    settings.show_visa !== false && "VISA",
    settings.show_mastercard !== false && "Mastercard",
    settings.show_amex !== false && "Amex",
    settings.show_afterpay !== false && "Afterpay",
    settings.show_paypal !== false && "PayPal",
    settings.show_apple_pay !== false && "Apple Pay",
  ].filter(Boolean) as string[];
  return (
    <section onClick={onSelect} className={`py-8 px-6 text-center ${sel(isEditing, isSelected)}`} style={{ backgroundColor: (settings.background_color as string) || "transparent" }}>
      <p className="text-xs uppercase tracking-widest mb-4 opacity-60" style={{ color: theme.accentColor }}>{title}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {methods.map(m => (
          <span key={m} className="px-3 py-1.5 text-xs font-bold rounded border" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>{m}</span>
        ))}
      </div>
    </section>
  );
}

function ProductDetailHeroSection({ settings, theme, isEditing, onSelect, isSelected, catalog }: SectionProps) {
  const slugs = Array.isArray(settings.product_slugs) ? settings.product_slugs as string[] : [];
  const product = catalog?.products.find(p => slugs.includes(p.sku) || slugs.includes(p.slug)) ?? catalog?.products[0];
  const layout = (settings.layout as string) || "left";
  return (
    <section onClick={onSelect} className={`flex ${layout === "right" ? "flex-row-reverse" : "flex-row"} gap-8 p-8 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: theme.secondaryColor }}>
      <div className="w-1/2 aspect-square rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
        {product?.image
          ? <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-80" />
          : <span className="text-slate-500 text-xs">Product Image</span>}
      </div>
      <div className="w-1/2 flex flex-col justify-center">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.primaryColor }}>{product?.category || "Category"}</p>
        <h1 className="text-3xl font-bold mb-3" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>{product?.name || "Product Name"}</h1>
        <p className="text-2xl font-bold mb-4" style={{ color: theme.primaryColor }}>{product ? formatAUD(product.price) : "$0.00"}</p>
        {settings.show_afterpay !== false && <p className="text-xs mb-4 opacity-60" style={{ color: theme.accentColor }}>or 4 × payments with Afterpay</p>}
        <button className="px-6 py-3 font-semibold rounded-sm self-start" style={{ background: theme.primaryColor, color: theme.secondaryColor }}>Add to Cart</button>
        {settings.show_reviews !== false && <div className="mt-4 text-amber-400 text-sm">★★★★★ <span className="opacity-60 text-xs" style={{ color: theme.accentColor }}>(47 reviews)</span></div>}
      </div>
    </section>
  );
}

function CollectionHeroSection({ settings, theme, isEditing, onSelect, isSelected, catalog }: SectionProps) {
  const title     = (settings.title as string)     || "Our Collection";
  const subtitle  = (settings.subtitle as string)  || "";
  const bgImage   = (settings.background_image_url as string) || "";
  const handle    = (settings.collection_handle as string) || "";
  const cols      = Number(settings.columns) || 3;
  const products  = catalog?.products.filter(p => !handle || p.category.toLowerCase() === handle.toLowerCase()).slice(0, cols) ?? [];
  return (
    <section onClick={onSelect} className={`${sel(isEditing, isSelected)}`} style={{ backgroundColor: theme.secondaryColor }}>
      <div className="relative flex items-center justify-start overflow-hidden px-8 py-16" style={{ minHeight: "280px" }}>
        {bgImage && <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>{title}</h1>
          {subtitle && <p className="opacity-60" style={{ color: theme.accentColor }}>{subtitle}</p>}
          {settings.show_filters !== false && (
            <div className="flex gap-2 mt-4">
              {["All", "New", "Sale"].map(f => (
                <span key={f} className="px-3 py-1 text-xs border rounded-sm" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>{f}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-4 px-8 pb-8" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 3)}, 1fr)` }}>
        {products.length > 0 ? products.map(p => (
          <div key={p.sku} className="rounded-sm overflow-hidden bg-slate-800">
            <div className="aspect-square">{p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-70" />}</div>
            <div className="p-3"><p className="text-xs truncate" style={{ color: theme.accentColor }}>{p.name}</p><p className="text-sm font-bold" style={{ color: theme.primaryColor }}>{formatAUD(p.price)}</p></div>
          </div>
        )) : Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="rounded-sm bg-slate-800 aspect-square flex items-center justify-center"><span className="text-slate-500 text-xs">Product {i + 1}</span></div>
        ))}
      </div>
    </section>
  );
}

function RingSizeGuideSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const title    = (settings.title as string)    || "Find Your Perfect Size";
  const subtitle = (settings.subtitle as string) || "Use our interactive guide to find your ring size in seconds.";
  const accent   = (settings.accent_color as string) || theme.primaryColor;
  const sizes = ["5", "6", "7", "8", "9", "10"];
  return (
    <section onClick={onSelect} className={`py-16 px-6 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: theme.secondaryColor }}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-3" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>{title}</h2>
        <p className="mb-8 opacity-60" style={{ color: theme.accentColor }}>{subtitle}</p>
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {sizes.map(s => (
            <div key={s} className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2" style={{ borderColor: accent, color: accent }}>
              {s}
            </div>
          ))}
        </div>
        <table className="w-full text-sm border-collapse mb-6">
          <thead><tr style={{ backgroundColor: accent + "20" }}>
            <th className="py-2 px-3 text-left" style={{ color: theme.accentColor }}>US Size</th>
            <th className="py-2 px-3" style={{ color: theme.accentColor }}>Diameter (mm)</th>
            <th className="py-2 px-3" style={{ color: theme.accentColor }}>Circumference (mm)</th>
          </tr></thead>
          <tbody>
            {[["5","15.7","49.3"],["6","16.5","51.9"],["7","17.3","54.4"],["8","18.2","57.1"]].map(([s,d,c]) => (
              <tr key={s} className="border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <td className="py-2 px-3 font-bold" style={{ color: accent }}>{s}</td>
                <td className="py-2 px-3 text-center opacity-70" style={{ color: theme.accentColor }}>{d}</td>
                <td className="py-2 px-3 text-center opacity-70" style={{ color: theme.accentColor }}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {settings.show_printable !== false && (
          <button className="px-6 py-2 text-sm border rounded-sm" style={{ borderColor: accent, color: accent }}>📄 Print Size Guide</button>
        )}
      </div>
    </section>
  );
}

function AccountDashboardSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const title = (settings.title as string) || "My Account";
  const tabs = [
    settings.show_wishlist !== false && "Wishlist",
    settings.show_orders !== false && "Orders",
    settings.show_loyalty !== false && "Loyalty Points",
    settings.show_recently_viewed !== false && "Recently Viewed",
  ].filter(Boolean) as string[];
  return (
    <section onClick={onSelect} className={`py-16 px-6 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: (settings.background_color as string) || theme.secondaryColor }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>{title}</h2>
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {tabs.map((t, i) => (
            <button key={t} className="px-4 py-2 text-sm font-medium" style={{ color: i === 0 ? theme.primaryColor : theme.accentColor, borderBottom: i === 0 ? `2px solid ${theme.primaryColor}` : "2px solid transparent" }}>{t}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-lg p-4 bg-slate-800 flex gap-3 items-center">
              <div className="w-12 h-12 rounded bg-slate-700" />
              <div><div className="w-24 h-3 bg-slate-600 rounded mb-2" /><div className="w-16 h-3 bg-slate-700 rounded" /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewArrivalsSection({ settings, theme, isEditing, onSelect, isSelected, catalog }: SectionProps) {
  const title   = (settings.title as string)   || "New Arrivals";
  const cols    = Number(settings.columns) || 4;
  const maxP    = Number(settings.max_products) || 8;
  const products = catalog?.products.slice(0, Math.min(cols, maxP)) ?? [];
  return (
    <section onClick={onSelect} className={`py-16 px-6 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: theme.secondaryColor }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>{title}</h2>
        {settings.subtitle ? <p className="text-center mb-8 opacity-60" style={{ color: theme.accentColor }}>{settings.subtitle as string}</p> : null}
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 4)}, 1fr)` }}>
          {products.length > 0 ? products.map(p => (
            <div key={p.sku} className="rounded-sm overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
              <div className="aspect-square relative">
                {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-80" />}
                {settings.show_savings_badge !== false && p.compare_price && p.compare_price > p.price && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ background: theme.primaryColor, color: theme.secondaryColor }}>
                    -{Math.round((1 - p.price / p.compare_price) * 100)}%
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs truncate mb-1" style={{ color: theme.accentColor }}>{p.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: theme.primaryColor }}>{formatAUD(p.price)}</p>
                  {settings.show_compare_price !== false && p.compare_price && (
                    <p className="text-xs line-through opacity-40" style={{ color: theme.accentColor }}>{formatAUD(p.compare_price)}</p>
                  )}
                </div>
              </div>
            </div>
          )) : Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="rounded-sm bg-slate-800 aspect-square flex items-center justify-center"><span className="text-slate-500 text-xs">Product {i + 1}</span></div>
          ))}
        </div>
        {settings.cta_text ? (
          <div className="text-center mt-8">
            <button className="px-8 py-3 text-sm font-medium border rounded-sm" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>{settings.cta_text as string}</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PromoBannerSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const eyebrow  = (settings.eyebrow as string)    || "Limited Time";
  const headline = (settings.headline as string)   || "Up to 31% Off New Arrivals";
  const body     = (settings.body as string)        || "";
  const ctaText  = (settings.cta_text as string)  || "Shop the Sale";
  const bg       = (settings.background_color as string) || "#111111";
  const accent   = (settings.accent_color as string)     || theme.primaryColor;
  const fg       = (settings.text_color as string)       || "#ffffff";
  const layout   = (settings.layout as string)     || "centered";
  const bgImage  = (settings.background_image_url as string) || "";
  return (
    <section onClick={onSelect} className={`relative py-16 px-6 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: bg }}>
      {bgImage && <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
      <div className={`relative max-w-4xl mx-auto ${layout === "centered" ? "text-center" : "text-left"}`}>
        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: accent }}>{eyebrow}</p>
        <h2 className="text-4xl font-bold mb-3" style={{ color: fg, fontFamily: theme.fontFamily }}>{headline}</h2>
        {body && <p className="mb-6 opacity-70" style={{ color: fg }}>{body}</p>}
        <button className="px-8 py-3 font-semibold rounded-sm" style={{ background: accent, color: bg }}>{ctaText}</button>
      </div>
    </section>
  );
}

function SavingsStripSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const items: string[] = Array.isArray(settings.items) ? (settings.items as string[]) : [
    "Free shipping over A$100", "GRA certified moissanite", "30-day returns",
  ];
  const bg  = (settings.background_color as string) || theme.primaryColor;
  const fg  = (settings.text_color as string)       || theme.secondaryColor;
  const sep = (settings.separator as string)        || "·";
  return (
    <div onClick={onSelect} className={`py-2.5 px-6 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: bg }}>
      <p className="text-[11px] uppercase tracking-widest font-bold text-center" style={{ color: fg }}>
        {items.join(`  ${sep}  `)}
      </p>
    </div>
  );
}

function MoissaniteShowcaseSection({ settings, theme, isEditing, onSelect, isSelected, catalog }: SectionProps) {
  const title    = (settings.title as string)    || "VVS1 Moissanite — GRA Certified";
  const subtitle = (settings.subtitle as string) || "";
  const cols     = Number(settings.columns) || 3;
  const products = catalog?.products.filter(p => p.category.toLowerCase() === "rings").slice(0, cols) ?? [];
  return (
    <section onClick={onSelect} className={`py-16 px-6 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: theme.secondaryColor }}>
      <div className="max-w-6xl mx-auto">
        {settings.show_gra_strip !== false && (
          <div className="rounded-lg p-4 mb-8 flex items-center gap-4" style={{ backgroundColor: theme.primaryColor + "20", border: `1px solid ${theme.primaryColor}40` }}>
            <span className="text-2xl">💎</span>
            <div>
              <p className="font-bold text-sm" style={{ color: theme.primaryColor }}>{(settings.gra_heading as string) || "GRA Certified Moissanite"}</p>
              <p className="text-xs opacity-60 line-clamp-2" style={{ color: theme.accentColor }}>{(settings.gra_body as string) || ""}</p>
            </div>
          </div>
        )}
        <h2 className="text-3xl font-bold text-center mb-2" style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}>{title}</h2>
        {subtitle && <p className="text-center mb-8 opacity-60" style={{ color: theme.accentColor }}>{subtitle}</p>}
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 3)}, 1fr)` }}>
          {products.length > 0 ? products.map(p => (
            <div key={p.sku} className="rounded-sm overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
              <div className="aspect-square">{p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-80" />}</div>
              <div className="p-3"><p className="text-xs truncate" style={{ color: theme.accentColor }}>{p.name}</p><p className="text-sm font-bold" style={{ color: theme.primaryColor }}>{formatAUD(p.price)}</p></div>
            </div>
          )) : Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="aspect-square rounded-sm bg-slate-800 flex items-center justify-center"><span className="text-slate-500 text-xs">Ring {i + 1}</span></div>
          ))}
        </div>
        {settings.show_diamond_comparison !== false && settings.diamond_comparison_text ? (
          <div className="mt-8 p-4 rounded-lg text-center" style={{ backgroundColor: "#1a1a1a", border: `1px solid ${theme.primaryColor}30` }}>
            <p className="text-sm italic opacity-70" style={{ color: theme.accentColor }}>{settings.diamond_comparison_text as string}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Config-only section — renders a settings panel preview in canvas */
function CategoryCopyEditorSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const categories = ["rings", "necklaces", "bracelets", "earrings", "pendants", "anklets"];
  return (
    <section onClick={onSelect} className={`py-8 px-6 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: theme.secondaryColor }}>
      <div className="max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: theme.primaryColor }}>⚙ Category Page Copy Settings</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map(cat => (
            <div key={cat} className="rounded-sm p-3 bg-slate-800">
              <p className="text-xs font-semibold capitalize mb-1" style={{ color: theme.primaryColor }}>{cat}</p>
              <p className="text-xs opacity-60 truncate" style={{ color: theme.accentColor }}>{(settings[`${cat}_title`] as string) || cat}</p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3 opacity-40 text-center" style={{ color: theme.accentColor }}>Edit titles, subtitles, and hero images for each collection page in the Inspector panel →</p>
      </div>
    </section>
  );
}

/** Config-only section — renders a settings panel preview in canvas */
function ProductBadgeSettingsSection({ settings, theme, isEditing, onSelect, isSelected }: SectionProps) {
  const bg  = (settings.badge_bg_color   as string) || theme.primaryColor;
  const fg  = (settings.badge_text_color as string) || theme.secondaryColor;
  const labels = [
    settings.new_badge_label        || "New",
    settings.sale_badge_label       || "Sale",
    settings.bestseller_badge_label || "Best Seller",
    settings.limited_badge_label    || "Limited",
  ] as string[];
  return (
    <section onClick={onSelect} className={`py-8 px-6 ${sel(isEditing, isSelected)}`} style={{ backgroundColor: theme.secondaryColor }}>
      <div className="max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: theme.primaryColor }}>⚙ Product Badge Settings</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {labels.map(l => (
            <span key={l} className="px-2 py-1 text-xs font-bold rounded-sm" style={{ backgroundColor: bg, color: fg }}>{l}</span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs opacity-60" style={{ color: theme.accentColor }}>
          <span>GRA callout: {settings.show_gra_callout ? "✓ On" : "✗ Off"}</span>
          <span>Savings badge: {settings.show_savings_badge ? "✓ On" : "✗ Off"}</span>
          <span>Min savings: {String(settings.savings_badge_min_percent ?? 10)}%</span>
          <span>Trigger: &ldquo;{String(settings.gra_materials_keyword ?? "moissanite")}&rdquo;</span>
        </div>
        <p className="text-xs mt-3 opacity-40 text-center" style={{ color: theme.accentColor }}>These settings are applied store-wide — edit in the Inspector panel →</p>
      </div>
    </section>
  );
}
