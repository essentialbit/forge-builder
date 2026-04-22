import { SectionDefinition } from '@/types/builder';

export const sectionRegistry: Record<string, SectionDefinition> = {
  hero: {
    type: 'hero',
    name: 'Hero',
    description: 'Full-width hero section with headline, CTA, and background image',
    icon: 'Sparkles',
    category: 'hero',
    defaultSettings: {
      headline: 'Iced Out Jewelry',
      subheadline: 'Premium jewellery for those who stand out',
      cta_text: 'Shop Now',
      cta_link: '/shop',
      background_image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80',
      overlay_opacity: 50,
      text_alignment: 'center',
      color_scheme: '',
      height: 'large',
      animation: 'fade-in',
    },
    schema: {
      headline: { type: 'text', label: 'Headline' },
      subheadline: { type: 'textarea', label: 'Subheadline' },
      cta_text: { type: 'text', label: 'CTA Text' },
      cta_link: { type: 'text', label: 'CTA Link' },
      background_image_url: { type: 'image', label: 'Background Image URL' },
      overlay_opacity: { type: 'number', label: 'Overlay Opacity', min: 0, max: 100 },
      text_alignment: {
        type: 'select',
        label: 'Text Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
      height: {
        type: 'select',
        label: 'Height',
        options: [
          { label: 'Small (40vh)', value: 'small' },
          { label: 'Medium (60vh)', value: 'medium' },
          { label: 'Large (80vh)', value: 'large' },
          { label: 'Full screen', value: 'full' },
        ],
      },
      animation: {
        type: 'select',
        label: 'Animation',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Fade in', value: 'fade-in' },
          { label: 'Fade up', value: 'fade-up' },
          { label: 'Zoom in', value: 'zoom-in' },
        ],
      },
      color_scheme: { type: 'color_scheme', label: 'Colour scheme' },
    },
  },
  announcement: {
    type: 'announcement',
    name: 'Announcement Bar',
    description: 'A dismissible announcement bar at the top of the page',
    icon: 'Megaphone',
    category: 'text',
    defaultSettings: {
      text: 'Free shipping on orders over $100',
      link: '/shipping',
      background_color: '#D4AF37',
      text_color: '#000000',
      dismissible: true,
    },
    schema: {
      text: { type: 'text', label: 'Announcement Text' },
      link: { type: 'text', label: 'Link URL' },
      background_color: { type: 'color', label: 'Background Color' },
      text_color: { type: 'color', label: 'Text Color' },
      dismissible: { type: 'toggle', label: 'Dismissible' },
    },
  },
  'product-grid': {
    type: 'product-grid',
    name: 'Product Grid',
    description: 'Display a grid of products',
    icon: 'Grid3x3',
    category: 'products',
    defaultSettings: {
      title: 'Featured Products',
      subtitle: 'Handpicked just for you',
      product_slugs: ['gold-chain', 'diamond-ring', 'silver-bracelet'],
      columns: 3,
      show_prices: true,
      show_add_to_cart: true,
    },
    schema: {
      title: { type: 'text', label: 'Title' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      product_slugs: { type: 'array', label: 'Product Slugs' },
      columns: { type: 'number', label: 'Columns', min: 2, max: 5 },
      show_prices: { type: 'toggle', label: 'Show Prices' },
      show_add_to_cart: { type: 'toggle', label: 'Show Add to Cart' },
    },
  },
  'category-showcase': {
    type: 'category-showcase',
    name: 'Category Showcase',
    description: 'Showcase product categories with images',
    icon: 'LayoutGrid',
    category: 'products',
    defaultSettings: {
      title: 'Shop by Category',
      subtitle: 'Find your perfect piece',
      category_slugs: ['rings', 'necklaces', 'bracelets', 'earrings'],
      display_mode: 'grid',
    },
    schema: {
      title: { type: 'text', label: 'Title' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      category_slugs: { type: 'array', label: 'Category Slugs' },
      display_mode: {
        type: 'select',
        label: 'Display Mode',
        options: [
          { label: 'Grid', value: 'grid' },
          { label: 'Carousel', value: 'carousel' },
        ],
      },
    },
  },
  'rich-text': {
    type: 'rich-text',
    name: 'Rich Text',
    description: 'Add custom text content with basic formatting',
    icon: 'FileText',
    category: 'text',
    defaultSettings: {
      content: '<p>Add your content here...</p>',
      max_width: 800,
      text_alignment: 'left',
    },
    schema: {
      content: { type: 'html', label: 'Content' },
      max_width: { type: 'number', label: 'Max Width (px)', min: 300, max: 1600 },
      text_alignment: {
        type: 'select',
        label: 'Text Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
    },
  },
  'image-block': {
    type: 'image-block',
    name: 'Image Block',
    description: 'Add an image with optional link',
    icon: 'Image',
    category: 'media',
    defaultSettings: {
      image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=80',
      alt_text: 'Image description',
      link_url: '',
      aspect_ratio: '16:9',
      caption: '',
    },
    schema: {
      image_url: { type: 'image', label: 'Image URL' },
      alt_text: { type: 'text', label: 'Alt Text' },
      link_url: { type: 'text', label: 'Link URL' },
      aspect_ratio: {
        type: 'select',
        label: 'Aspect Ratio',
        options: [
          { label: '16:9', value: '16:9' },
          { label: '4:3', value: '4:3' },
          { label: '1:1', value: '1:1' },
          { label: '3:4', value: '3:4' },
        ],
      },
      caption: { type: 'text', label: 'Caption' },
    },
  },
  'trust-badges': {
    type: 'trust-badges',
    name: 'Trust Badges',
    description: 'Display trust badges like secure checkout, free shipping, etc.',
    icon: 'Shield',
    category: 'commerce',
    defaultSettings: {
      badges: [
        { icon: 'ShieldCheck', label: 'Secure Checkout', link: '/security' },
        { icon: 'Truck', label: 'Free Shipping', link: '/shipping' },
        { icon: 'RefreshCw', label: '30-Day Returns', link: '/returns' },
        { icon: 'Headphones', label: '24/7 Support', link: '/support' },
      ],
    },
    schema: {
      badges: {
        type: 'array',
        label: 'Badges',
      },
    },
  },
  newsletter: {
    type: 'newsletter',
    name: 'Newsletter',
    description: 'Email newsletter signup form',
    icon: 'Mail',
    category: 'commerce',
    defaultSettings: {
      heading: 'Join the Club',
      description: 'Get exclusive access to new arrivals, promotions, and more.',
      button_text: 'Subscribe',
      list_id: 'newsletter',
    },
    schema: {
      heading: { type: 'text', label: 'Heading' },
      description: { type: 'textarea', label: 'Description' },
      button_text: { type: 'text', label: 'Button Text' },
      list_id: { type: 'text', label: 'List ID' },
    },
  },
  footer: {
    type: 'footer',
    name: 'Footer',
    description: 'Site footer with columns of links',
    icon: 'AlignBottom',
    category: 'navigation',
    defaultSettings: {
      columns: [
        {
          heading: 'Shop',
          links: [
            { label: 'All Products', url: '/shop' },
            { label: 'Rings', url: '/collections/rings' },
            { label: 'Necklaces', url: '/collections/necklaces' },
          ],
        },
        {
          heading: 'Help',
          links: [
            { label: 'Contact Us', url: '/contact' },
            { label: 'FAQs', url: '/faqs' },
            { label: 'Shipping', url: '/shipping' },
          ],
        },
        {
          heading: 'About',
          links: [
            { label: 'Our Story', url: '/about' },
            { label: 'Blog', url: '/blog' },
          ],
        },
      ],
      copyright_text: '© 2026 Forge Jewellery. All rights reserved.',
      social_links: [
        { label: 'Instagram', url: 'https://instagram.com' },
        { label: 'TikTok', url: 'https://tiktok.com' },
      ],
    },
    schema: {
      columns: { type: 'array', label: 'Columns' },
      copyright_text: { type: 'text', label: 'Copyright Text' },
      social_links: { type: 'array', label: 'Social Links' },
    },
  },
};

export const sectionCategories = [
  { id: 'hero', name: 'Hero', icon: 'Sparkles' },
  { id: 'text', name: 'Text', icon: 'FileText' },
  { id: 'media', name: 'Media', icon: 'Image' },
  { id: 'products', name: 'Products', icon: 'Grid3x3' },
  { id: 'commerce', name: 'Commerce', icon: 'ShoppingCart' },
  { id: 'navigation', name: 'Navigation', icon: 'Menu' },
  { id: 'social', name: 'Social', icon: 'Users' },
];

export function getSectionDefinition(type: string): SectionDefinition | undefined {
  return sectionRegistry[type];
}
