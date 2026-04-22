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
