import type { ColorScheme, ThemeConfig, Project } from '@/types/builder';

/** Popular Google Fonts curated for ecommerce / editorial use. */
export const GOOGLE_FONTS: Array<{ name: string; category: 'sans' | 'serif' | 'display' | 'mono' }> = [
  // Sans
  { name: 'Inter', category: 'sans' },
  { name: 'Manrope', category: 'sans' },
  { name: 'DM Sans', category: 'sans' },
  { name: 'Poppins', category: 'sans' },
  { name: 'Montserrat', category: 'sans' },
  { name: 'Lato', category: 'sans' },
  { name: 'Raleway', category: 'sans' },
  { name: 'Work Sans', category: 'sans' },
  { name: 'Figtree', category: 'sans' },
  { name: 'Plus Jakarta Sans', category: 'sans' },
  { name: 'Outfit', category: 'sans' },
  { name: 'Nunito', category: 'sans' },
  { name: 'Open Sans', category: 'sans' },
  // Serif / editorial
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Cormorant Garamond', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'EB Garamond', category: 'serif' },
  { name: 'Fraunces', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Crimson Pro', category: 'serif' },
  { name: 'Libre Baskerville', category: 'serif' },
  // Display
  { name: 'Bebas Neue', category: 'display' },
  { name: 'Oswald', category: 'display' },
  { name: 'Archivo Black', category: 'display' },
  { name: 'Abril Fatface', category: 'display' },
  // Mono
  { name: 'JetBrains Mono', category: 'mono' },
  { name: 'IBM Plex Mono', category: 'mono' },
];

/** Built-in color scheme presets. */
export const PRESET_SCHEMES: ColorScheme[] = [
  {
    id: 'scheme-light',
    name: 'Light',
    background: '#ffffff',
    text: '#0a0a0a',
    accent: '#D4AF37',
    onAccent: '#0a0a0a',
    muted: '#6b7280',
    border: '#e5e7eb',
  },
  {
    id: 'scheme-dark',
    name: 'Dark',
    background: '#0a0a0a',
    text: '#ffffff',
    accent: '#D4AF37',
    onAccent: '#0a0a0a',
    muted: '#9ca3af',
    border: '#1f2937',
  },
  {
    id: 'scheme-accent',
    name: 'Accent',
    background: '#D4AF37',
    text: '#0a0a0a',
    accent: '#0a0a0a',
    onAccent: '#ffffff',
    muted: '#374151',
    border: '#b8962f',
  },
  {
    id: 'scheme-cream',
    name: 'Cream',
    background: '#FAF6EF',
    text: '#2c1810',
    accent: '#D4AF37',
    onAccent: '#ffffff',
    muted: '#6b5a46',
    border: '#e8dfc9',
  },
];

/** Fill in missing defaults on a theme so it's safe to use everywhere. */
export function normalizeTheme(theme: Partial<ThemeConfig> | undefined): ThemeConfig {
  const schemes = theme?.colorSchemes && theme.colorSchemes.length > 0 ? theme.colorSchemes : PRESET_SCHEMES;
  return {
    primaryColor: theme?.primaryColor ?? '#D4AF37',
    secondaryColor: theme?.secondaryColor ?? '#0a0a0a',
    accentColor: theme?.accentColor ?? '#ffffff',
    fontFamily: theme?.fontFamily ?? 'Inter',
    headingFontFamily: theme?.headingFontFamily,
    logo: theme?.logo ?? '',
    colorSchemes: schemes,
    defaultColorSchemeId: theme?.defaultColorSchemeId ?? schemes[0]?.id,
    radiusScale: theme?.radiusScale ?? 'md',
    spacingScale: theme?.spacingScale ?? 'normal',
    maxContentWidth: theme?.maxContentWidth ?? 1200,
  };
}

export function getScheme(theme: ThemeConfig, id?: string): ColorScheme {
  const schemes = theme.colorSchemes ?? PRESET_SCHEMES;
  if (id) {
    const found = schemes.find((s) => s.id === id);
    if (found) return found;
  }
  const def = schemes.find((s) => s.id === theme.defaultColorSchemeId);
  return def ?? schemes[0] ?? PRESET_SCHEMES[0];
}

export function radiusValue(scale: ThemeConfig['radiusScale']): string {
  switch (scale) {
    case 'none': return '0px';
    case 'sm': return '4px';
    case 'lg': return '16px';
    case 'full': return '9999px';
    case 'md':
    default: return '8px';
  }
}

/** Google Fonts CSS URL for all fonts used in a project (heading + body). */
export function googleFontsHref(fonts: string[]): string {
  const unique = Array.from(new Set(fonts.filter(Boolean)));
  if (unique.length === 0) return '';
  const families = unique
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/** Upgrade any project's theme in-place if fields are missing (idempotent). */
export function upgradeProjectTheme<T extends Pick<Project, 'theme'>>(project: T): T {
  project.theme = normalizeTheme(project.theme);
  return project;
}
