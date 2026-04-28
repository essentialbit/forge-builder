import { blockRegistry } from '@/lib/block-registry';

// Helper to get the block def for use in section definitions
const { testimonial_card, faq_item, trust_badge, footer_column, newsletter_social_link, comparison_row } = blockRegistry;

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
    description: 'Display a grid of products from your catalog',
    icon: 'Grid3x3',
    category: 'products',
    defaultSettings: {
      title: 'Featured Products',
      subtitle: 'Handpicked just for you',
      collection_handle: '',
      product_slugs: [],
      columns: 3,
      show_prices: true,
      show_add_to_cart: true,
    },
    schema: {
      title: { type: 'text', label: 'Title' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      collection_handle: { type: 'text', label: 'Collection handle (auto-filters)' },
      product_slugs: { type: 'product', label: 'Products' },
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

  // Trust badges now use blocks for each badge item
  'trust-badges': {
    type: 'trust-badges',
    name: 'Trust Badges',
    description: 'Display trust badges — each badge is a block you can add/remove/reorder',
    icon: 'Shield',
    category: 'commerce',
    blocks: [trust_badge],
    defaultSettings: {
      title: '',
    },
    schema: {
      title: { type: 'text', label: 'Section title (optional)' },
    },
  },

  newsletter: {
    type: 'newsletter',
    name: 'Newsletter',
    description: 'Email newsletter signup form with social links',
    icon: 'Mail',
    category: 'commerce',
    blocks: [newsletter_social_link],
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
    description: 'Site footer with columns — each column is a block you can edit',
    icon: 'AlignBottom',
    category: 'navigation',
    blocks: [footer_column],
    defaultSettings: {
      copyright_text: '© 2026 Forge Jewellery. All rights reserved.',
    },
    schema: {
      copyright_text: { type: 'text', label: 'Copyright Text' },
    },
  },

  // FAQ now uses faq_item blocks
  faq: {
    type: 'faq',
    name: 'FAQ',
    description: 'Accordion-style frequently asked questions — add/edit/reorder questions as blocks',
    icon: 'HelpCircle',
    category: 'text',
    blocks: [faq_item],
    defaultSettings: {
      title: 'Frequently asked questions',
      subtitle: '',
    },
    schema: {
      title: { type: 'text', label: 'Title' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
    },
  },

  // Testimonials section: each testimonial is a block
  testimonials: {
    type: 'testimonials',
    name: 'Testimonials',
    description: 'Customer quotes with star ratings — each testimonial is a block you can add/remove/reorder',
    icon: 'MessageCircle',
    category: 'social',
    blocks: [testimonial_card],
    defaultSettings: {
      title: 'What our customers say',
    },
    schema: {
      title: { type: 'text', label: 'Title' },
    },
  },

  featured_product: {
    type: 'featured_product',
    name: 'Featured Product',
    description: 'Highlight a single product with large image and details',
    icon: 'Star',
    category: 'products',
    defaultSettings: {
      product_slugs: [],
      layout: 'split',
      show_description: true,
      color_scheme: '',
    },
    schema: {
      product_slugs: { type: 'product', label: 'Product' },
      layout: {
        type: 'select',
        label: 'Layout',
        options: [
          { label: 'Image left, text right', value: 'split' },
          { label: 'Image right, text left', value: 'split-reverse' },
          { label: 'Stacked', value: 'stacked' },
        ],
      },
      show_description: { type: 'toggle', label: 'Show description' },
      color_scheme: { type: 'color_scheme', label: 'Colour scheme' },
    },
  },

  spacer: {
    type: 'spacer',
    name: 'Spacer',
    description: 'Empty vertical space',
    icon: 'Minus',
    category: 'text',
    defaultSettings: { height: 80 },
    schema: {
      height: { type: 'number', label: 'Height (px)', min: 20, max: 400, step: 10 },
    },
  },

  // ── New section types ─────────────────────────────────────────────────────

  'video-hero': {
    type: 'video-hero',
    name: 'Video Hero',
    description: 'Full-width video background hero section',
    icon: 'Play',
    category: 'hero',
    defaultSettings: {
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      poster_image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80',
      headline: 'Crafted for Those Who Stand Out',
      subheadline: 'Premium jewellery. Uncompromising quality.',
      cta_text: 'Shop Now',
      cta_link: '/collections/necklaces',
      overlay_opacity: 40,
      height: 'large',
    },
    schema: {
      video_url: { type: 'text', label: 'Video URL (.mp4)' },
      poster_image: { type: 'image', label: 'Poster / Fallback Image' },
      headline: { type: 'text', label: 'Headline' },
      subheadline: { type: 'textarea', label: 'Subheadline' },
      cta_text: { type: 'text', label: 'CTA Button Text' },
      cta_link: { type: 'text', label: 'CTA Link' },
      overlay_opacity: { type: 'number', label: 'Video Overlay Opacity', min: 0, max: 90 },
      height: {
        type: 'select',
        label: 'Height',
        options: [
          { label: 'Small (50vh)', value: 'small' },
          { label: 'Medium (70vh)', value: 'medium' },
          { label: 'Large (85vh)', value: 'large' },
          { label: 'Full screen', value: 'full' },
        ],
      },
    },
  },

  'countdown-timer': {
    type: 'countdown-timer',
    name: 'Countdown Timer',
    description: 'Countdown timer for flash sales and limited-time offers',
    icon: 'Timer',
    category: 'commerce',
    defaultSettings: {
      title: 'Sale Ends In',
      subtitle: 'Limited stock — don\'t miss out',
      end_date: '2026-12-31T23:59:59',
      background_color: '#111111',
      accent_color: '#C5A059',
      redirect_url: '',
    },
    schema: {
      title: { type: 'text', label: 'Heading' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      end_date: { type: 'text', label: 'End date & time (ISO 8601, e.g. 2026-12-31T23:59:59)' },
      background_color: { type: 'color', label: 'Background Colour' },
      accent_color: { type: 'color', label: 'Accent Colour' },
      redirect_url: { type: 'text', label: 'Redirect URL when timer ends (optional)' },
    },
  },

  'comparison-table': {
    type: 'comparison-table',
    name: 'Comparison Table',
    description: 'Feature comparison table — show why you\'re better than the competition',
    icon: 'GitCompare',
    category: 'products',
    blocks: [comparison_row],
    defaultSettings: {
      title: 'Why Choose Forge?',
      subtitle: 'We\'re not just cheaper. We\'re genuinely better.',
      us_label: 'Forge Jewellery',
      them_label: 'Competitors',
    },
    schema: {
      title: { type: 'text', label: 'Heading' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      us_label: { type: 'text', label: 'Your brand label' },
      them_label: { type: 'text', label: 'Competitor label' },
    },
  },

  'payment-badges': {
    type: 'payment-badges',
    name: 'Payment Badges',
    description: 'Accepted payment methods and security trust marks',
    icon: 'CreditCard',
    category: 'commerce',
    defaultSettings: {
      title: 'Safe & Secure Checkout',
      show_afterpay: true,
      show_visa: true,
      show_mastercard: true,
      show_amex: true,
      show_paypal: true,
      show_apple_pay: true,
      background_color: 'transparent',
    },
    schema: {
      title: { type: 'text', label: 'Section Title' },
      show_afterpay: { type: 'toggle', label: 'Show Afterpay' },
      show_visa: { type: 'toggle', label: 'Show Visa' },
      show_mastercard: { type: 'toggle', label: 'Show Mastercard' },
      show_amex: { type: 'toggle', label: 'Show Amex' },
      show_paypal: { type: 'toggle', label: 'Show PayPal' },
      show_apple_pay: { type: 'toggle', label: 'Show Apple Pay' },
      background_color: { type: 'color', label: 'Background Colour' },
    },
  },

  'product-detail-hero': {
    type: 'product-detail-hero',
    name: 'Product Detail Section',
    description: 'Full product detail layout with gallery, price, add to cart, and reviews',
    icon: 'ShoppingBag',
    category: 'products',
    defaultSettings: {
      product_slugs: [],
      show_reviews: true,
      show_size_guide: true,
      show_afterpay: true,
      layout: 'left',
      color_scheme: '',
    },
    schema: {
      product_slugs: { type: 'product', label: 'Feature Product' },
      show_reviews: { type: 'toggle', label: 'Show Reviews' },
      show_size_guide: { type: 'toggle', label: 'Show Size Guide' },
      show_afterpay: { type: 'toggle', label: 'Show Afterpay Badge' },
      layout: {
        type: 'select',
        label: 'Image Position',
        options: [
          { label: 'Image left', value: 'left' },
          { label: 'Image right', value: 'right' },
        ],
      },
      color_scheme: { type: 'color_scheme', label: 'Colour Scheme' },
    },
  },

  'collection-hero': {
    type: 'collection-hero',
    name: 'Collection Hero',
    description: 'Category page hero with editorial copy, filters, and product grid',
    icon: 'LayoutGrid',
    category: 'hero',
    defaultSettings: {
      collection_handle: 'necklaces',
      title: 'Our Necklaces',
      subtitle: 'From subtle to statement — crafted for everyday wear.',
      background_image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80',
      show_filters: true,
      show_sort: true,
      columns: 3,
    },
    schema: {
      collection_handle: { type: 'text', label: 'Collection / Category handle' },
      title: { type: 'text', label: 'Hero Title' },
      subtitle: { type: 'textarea', label: 'Hero Subtitle' },
      background_image_url: { type: 'image', label: 'Hero Background Image' },
      show_filters: { type: 'toggle', label: 'Show Filter Sidebar' },
      show_sort: { type: 'toggle', label: 'Show Sort Dropdown' },
      columns: { type: 'number', label: 'Product Grid Columns', min: 2, max: 4 },
    },
  },

  'ring-size-guide': {
    type: 'ring-size-guide',
    name: 'Ring Size Guide',
    description: 'Interactive ring size guide with conversion chart and printable sizer',
    icon: 'Ruler',
    category: 'text',
    defaultSettings: {
      title: 'Find Your Perfect Size',
      subtitle: 'Use our interactive guide to find your ring size in seconds.',
      show_interactive_sizer: true,
      show_printable: true,
      accent_color: '#C5A059',
    },
    schema: {
      title: { type: 'text', label: 'Heading' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      show_interactive_sizer: { type: 'toggle', label: 'Show Interactive Sizer' },
      show_printable: { type: 'toggle', label: 'Show Printable Button' },
      accent_color: { type: 'color', label: 'Accent Colour' },
    },
  },

  'account-dashboard': {
    type: 'account-dashboard',
    name: 'Account Dashboard',
    description: 'Customer account section with wishlist, orders, and loyalty points',
    icon: 'User',
    category: 'commerce',
    defaultSettings: {
      title: 'My Account',
      show_wishlist: true,
      show_orders: true,
      show_loyalty: true,
      show_recently_viewed: true,
      background_color: '#0a0a0a',
    },
    schema: {
      title: { type: 'text', label: 'Section Title' },
      show_wishlist: { type: 'toggle', label: 'Show Wishlist Tab' },
      show_orders: { type: 'toggle', label: 'Show Orders Tab' },
      show_loyalty: { type: 'toggle', label: 'Show Loyalty Points Tab' },
      show_recently_viewed: { type: 'toggle', label: 'Show Recently Viewed Tab' },
      background_color: { type: 'color', label: 'Background Colour' },
    },
  },

} as unknown as Record<string, SectionDefinition>;

export const sectionCategories = [
  { id: 'hero',       name: 'Hero',        icon: 'Sparkles'     },
  { id: 'text',       name: 'Text',        icon: 'FileText'     },
  { id: 'media',      name: 'Media',       icon: 'Image'        },
  { id: 'products',   name: 'Products',    icon: 'Grid3x3'      },
  { id: 'commerce',   name: 'Commerce',    icon: 'ShoppingCart' },
  { id: 'navigation', name: 'Navigation',  icon: 'Menu'         },
  { id: 'social',     name: 'Social',      icon: 'Users'        },
  { id: 'conversion', name: 'Conversion',  icon: 'TrendingUp'   },
];

export function getSectionDefinition(type: string): SectionDefinition | undefined {
  return sectionRegistry[type];
}

type SectionDefinition = import('@/types/builder').SectionDefinition;