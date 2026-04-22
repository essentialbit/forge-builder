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

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logo: string;
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
  | 'toggle'
  | 'select'
  | 'number'
  | 'array'
  | 'html';
