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
  | 'footer';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface Project {
  id: string;
  name: string;
  description: string;
  created: string;
  updated: string;
  status: 'draft' | 'published';
  theme: ThemeConfig;
  pages: Page[];
  /**
   * Client-hydrated: full section records keyed by id.
   * Server persists sections as individual JSON files; the
   * /api/projects/[id] endpoint returns an array which we
   * normalize into this map on the client.
   */
  sections?: Record<string, Section>;
}

export interface ColorScheme {
  id: string;
  name: string;
  /** Background for page sections using this scheme */
  background: string;
  /** Primary text color on the background */
  text: string;
  /** Accent / brand CTA color */
  accent: string;
  /** Text color on accent (buttons etc.) */
  onAccent: string;
  /** Muted/subtle text */
  muted: string;
  /** Border color */
  border: string;
}

export interface ThemeConfig {
  // Legacy flat colours (kept for backwards-compatibility with existing sections)
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  /** Optional heading font (falls back to fontFamily) */
  headingFontFamily?: string;
  logo: string;

  // New: named color schemes
  colorSchemes?: ColorScheme[];
  /** Default scheme id for sections that don't pick one */
  defaultColorSchemeId?: string;

  // Design tokens
  radiusScale?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  spacingScale?: 'tight' | 'normal' | 'relaxed';
  maxContentWidth?: number; // px
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  sections: string[]; // Section IDs
}

export interface Section {
  id: string;
  type: SectionType;
  name: string;
  settings: Record<string, unknown>;
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
  defaultSettings: Record<string, unknown>;
  schema: SectionSchema;
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
