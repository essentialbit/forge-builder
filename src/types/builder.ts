// Core types for the Forge Builder

export type SectionType =
  | 'hero'
  | 'announcement'
  | 'product-grid'
  | 'category-showcase'
  | 'rich-text'
  | 'image-block'
  | 'trust-badges'
  | 'newsletter'
  | 'footer'
  | 'faq'
  | 'featured_product'
  | 'testimonials'
  | 'spacer'
  // Added in previous session
  | 'video-hero'
  | 'countdown-timer'
  | 'comparison-table'
  | 'payment-badges'
  | 'product-detail-hero'
  | 'collection-hero'
  | 'ring-size-guide'
  | 'account-dashboard'
  // Added for KRKC catalogue features
  | 'new-arrivals'
  | 'promo-banner'
  | 'savings-strip'
  | 'moissanite-showcase'
  | 'category-copy-editor'
  | 'product-badge-settings';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// ─────────────────────────────────────────────────────────────────────────────
// Block primitive — typed sub-content inside a section
// A block is the smallest editable unit. Sections that declare `blocks: [blockDef]`
// in their schema can contain zero or more blocks of allowed types.
// ─────────────────────────────────────────────────────────────────────────────
export type BlockType = 'testimonial_card' | 'faq_item' | 'trust_badge' | 'footer_link' | 'footer_column' | 'newsletter_social_link' | 'comparison_row' | 'gra_badge' | 'new_arrival_card';

export interface Block {
  id: string;          // e.g. "blk_xxxx"
  type: BlockType;
  settings: Record<string, unknown>;
}

export interface BlockDefinition {
  type: BlockType;
  name: string;
  icon: string;
  schema: SectionSchema; // same field schema type as sections
  /** Default settings for a new block of this type */
  defaultSettings: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  description: string;
  created: string;
  updated: string;
  status: 'draft' | 'published';
  theme: ThemeConfig;
  pages: Page[];
  sections?: Record<string, Section>;
}

export interface ColorScheme {
  id: string;
  name: string;
  background: string;
  text: string;
  accent: string;
  onAccent: string;
  muted: string;
  border: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headingFontFamily?: string;
  logo: string;
  colorSchemes?: ColorScheme[];
  defaultColorSchemeId?: string;
  radiusScale?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  spacingScale?: 'tight' | 'normal' | 'relaxed';
  maxContentWidth?: number;
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  sections: string[]; // Section IDs
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
}

export interface Section {
  id: string;
  type: SectionType;
  name: string;
  settings: Record<string, unknown>;
  /**
   * Optional blocks nested inside this section.
   * Only sections that declare `blocks: [...]` in their definition can hold blocks.
   */
  blocks?: Block[];
  responsive?: {
    hideMobile?: boolean;
    hideTablet?: boolean;
    hideDesktop?: boolean;
    mobile?: Record<string, unknown>;
    tablet?: Record<string, unknown>;
  };
}

export interface BrandKit {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logo: string;
}

export interface SectionDefinition {
  type: SectionType;
  name: string;
  description: string;
  icon: string;
  category: SectionCategory;
  /** Schema for the section's own settings */
  schema: SectionSchema;
  defaultSettings: Record<string, unknown>;
  /**
   * Block types this section can contain.
   * If defined, the Inspector shows a block editor panel.
   * Example: testimonials section → accepts `testimonial_card` blocks.
   */
  blocks?: BlockDefinition[];
}

export type SectionCategory =
  | 'hero'
  | 'text'
  | 'media'
  | 'products'
  | 'commerce'
  | 'navigation'
  | 'social';

export interface SectionSchema {
  [key: string]: FieldSchema;
}

export interface FieldSchema {
  type: FieldType;
  label: string;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'image'
  | 'color'
  | 'color_scheme'
  | 'toggle'
  | 'select'
  | 'number'
  | 'array'
  | 'html'
  | 'font_picker'
  | 'product';