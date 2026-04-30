import { blockRegistry } from '@/lib/block-registry';

// Helper to get the block def for use in section definitions
const { testimonial_card, faq_item, trust_badge, footer_column, newsletter_social_link, comparison_row, gra_badge, new_arrival_card } = blockRegistry;

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
      show_compare_price: true,
      show_savings_badge: true,
      badge_filter: '',
    },
    schema: {
      title: { type: 'text', label: 'Title' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      collection_handle: { type: 'text', label: 'Collection / category filter (e.g. bracelets)' },
      product_slugs: { type: 'product', label: 'Pin specific products' },
      columns: { type: 'number', label: 'Columns', min: 2, max: 5 },
      show_prices: { type: 'toggle', label: 'Show Prices' },
      show_compare_price: { type: 'toggle', label: 'Show Was/Compare Price' },
      show_savings_badge: { type: 'toggle', label: 'Show Discount % Badge' },
      show_add_to_cart: { type: 'toggle', label: 'Show Add to Cart' },
      badge_filter: {
        type: 'select',
        label: 'Filter by badge (optional)',
        options: [
          { label: 'All products', value: '' },
          { label: 'New arrivals only', value: 'new' },
          { label: 'On sale only', value: 'sale' },
          { label: 'Bestsellers only', value: 'bestseller' },
          { label: 'Limited edition only', value: 'limited' },
        ],
      },
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

  // ── KRKC Catalogue Feature Sections ─────────────────────────────────────
  // These sections let non-technical staff control everything we added for
  // the KRKC product batch: new arrivals, promo messaging, savings badges,
  // moissanite certification callouts, and per-category editorial copy.

  /**
   * new-arrivals
   * Spotlights products tagged badge:"new". Staff can pin specific SKUs
   * via blocks OR let it auto-populate from the `badge: 'new'` catalogue
   * field. Controls title, max count, and layout.
   */
  'new-arrivals': {
    type: 'new-arrivals',
    name: 'New Arrivals',
    description: 'Showcase the latest products — auto-populated from "new" badge or manually pinned via blocks',
    icon: 'Sparkles',
    category: 'products',
    blocks: [new_arrival_card],
    defaultSettings: {
      title: 'New Arrivals',
      subtitle: 'Fresh from our latest KRKC sourcing run — now available in Australia.',
      max_products: 8,
      columns: 4,
      auto_populate: true,
      show_savings_badge: true,
      show_compare_price: true,
      cta_text: 'View all new arrivals',
      cta_link: '/collections/all?badge=new',
      color_scheme: '',
    },
    schema: {
      title: { type: 'text', label: 'Section Title' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      max_products: { type: 'number', label: 'Max products to show (auto mode)', min: 4, max: 24, step: 4 },
      columns: { type: 'number', label: 'Grid columns', min: 2, max: 5 },
      auto_populate: { type: 'toggle', label: 'Auto-populate from catalogue (badge = "new")' },
      show_compare_price: { type: 'toggle', label: 'Show Was / Compare Price' },
      show_savings_badge: { type: 'toggle', label: 'Show Discount % Badge' },
      cta_text: { type: 'text', label: 'View all button label' },
      cta_link: { type: 'text', label: 'View all link URL' },
      color_scheme: { type: 'color_scheme', label: 'Colour scheme' },
    },
  },

  /**
   * promo-banner
   * A full-width, visually prominent promotional strip — distinct from the
   * announcement bar. Used for major sale announcements, seasonal campaigns,
   * and "up to X% off" messaging that needs more visual weight than a bar.
   */
  'promo-banner': {
    type: 'promo-banner',
    name: 'Promo Banner',
    description: 'Full-width promotional banner for sales, campaigns, and discount announcements',
    icon: 'Tag',
    category: 'conversion',
    defaultSettings: {
      eyebrow: 'Limited Time',
      headline: 'Up to 31% Off New Arrivals',
      body: 'Our latest KRKC-sourced Cuban chains, iced bracelets, and moissanite rings — now at launch prices.',
      cta_text: 'Shop the Sale',
      cta_link: '/collections/all?badge=new',
      secondary_cta_text: '',
      secondary_cta_link: '',
      background_image_url: '',
      background_color: '#111111',
      accent_color: '#C5A059',
      text_color: '#ffffff',
      layout: 'centered',
      show_countdown: false,
      countdown_end: '',
    },
    schema: {
      eyebrow: { type: 'text', label: 'Eyebrow label (small text above headline)' },
      headline: { type: 'text', label: 'Headline' },
      body: { type: 'textarea', label: 'Body copy' },
      cta_text: { type: 'text', label: 'Primary CTA text' },
      cta_link: { type: 'text', label: 'Primary CTA link' },
      secondary_cta_text: { type: 'text', label: 'Secondary CTA text (optional)' },
      secondary_cta_link: { type: 'text', label: 'Secondary CTA link' },
      background_image_url: { type: 'image', label: 'Background image (optional)' },
      background_color: { type: 'color', label: 'Background colour' },
      accent_color: { type: 'color', label: 'Accent / highlight colour' },
      text_color: { type: 'color', label: 'Text colour' },
      layout: {
        type: 'select',
        label: 'Layout',
        options: [
          { label: 'Centered', value: 'centered' },
          { label: 'Left-aligned', value: 'left' },
          { label: 'Split (text left, image right)', value: 'split' },
        ],
      },
      show_countdown: { type: 'toggle', label: 'Show countdown timer' },
      countdown_end: { type: 'text', label: 'Countdown end (ISO 8601, e.g. 2026-12-31T23:59:59)' },
    },
  },

  /**
   * savings-strip
   * A thin, high-contrast horizontal strip — typically placed above the
   * footer or between sections — that communicates the discount value prop.
   * E.g. "Save 20–31% vs RRP · Free shipping over $100 · GRA certified"
   */
  'savings-strip': {
    type: 'savings-strip',
    name: 'Savings Strip',
    description: 'Thin strip highlighting key value propositions — savings %, free shipping, certifications',
    icon: 'BadgePercent',
    category: 'conversion',
    defaultSettings: {
      items: [
        'Save 20–31% vs RRP on new arrivals',
        'Free shipping over $100',
        'GRA certified moissanite',
        '30-day returns',
      ],
      background_color: '#C5A059',
      text_color: '#000000',
      separator: '·',
      scroll_speed: 'normal',
      scrolling: false,
    },
    schema: {
      items: { type: 'array', label: 'Strip items (editable list)' },
      background_color: { type: 'color', label: 'Background colour' },
      text_color: { type: 'color', label: 'Text colour' },
      separator: {
        type: 'select',
        label: 'Item separator',
        options: [
          { label: '·  (dot)', value: '·' },
          { label: '|  (pipe)', value: '|' },
          { label: '★  (star)', value: '★' },
          { label: '–  (dash)', value: '–' },
        ],
      },
      scrolling: { type: 'toggle', label: 'Auto-scroll (marquee)' },
      scroll_speed: {
        type: 'select',
        label: 'Scroll speed',
        options: [
          { label: 'Slow', value: 'slow' },
          { label: 'Normal', value: 'normal' },
          { label: 'Fast', value: 'fast' },
        ],
      },
    },
  },

  /**
   * moissanite-showcase
   * A dedicated section for spotlighting moissanite products — includes
   * the GRA certification trust callout, product grid, and optional
   * comparison against diamond pricing. Designed to convert buyers who
   * are price-comparing against fine jewellery.
   */
  'moissanite-showcase': {
    type: 'moissanite-showcase',
    name: 'Moissanite Showcase',
    description: 'Highlight moissanite products with GRA certification trust callouts and diamond-comparison messaging',
    icon: 'Gem',
    category: 'products',
    blocks: [gra_badge],
    defaultSettings: {
      title: 'VVS1 Moissanite — GRA Certified',
      subtitle: 'The same fire as diamonds. A fraction of the price. Every stone is independently certified.',
      columns: 3,
      show_gra_strip: true,
      gra_heading: 'GRA Certified Moissanite',
      gra_body: 'Every moissanite piece in our collection comes with a GRA certificate. VVS1 D-Colour — the same refractive index as diamond, cut to the same proportions, at a price that makes sense.',
      show_diamond_comparison: true,
      diamond_comparison_text: 'A 1ct diamond ring: $5,000–$15,000. Our 1ct moissanite ring: under $100.',
      product_slugs: [],
      cta_text: 'Shop Moissanite',
      cta_link: '/collections/rings',
      color_scheme: '',
    },
    schema: {
      title: { type: 'text', label: 'Section title' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      columns: { type: 'number', label: 'Grid columns', min: 2, max: 4 },
      show_gra_strip: { type: 'toggle', label: 'Show GRA certification strip' },
      gra_heading: { type: 'text', label: 'GRA strip heading' },
      gra_body: { type: 'textarea', label: 'GRA strip body text' },
      show_diamond_comparison: { type: 'toggle', label: 'Show diamond price comparison callout' },
      diamond_comparison_text: { type: 'textarea', label: 'Diamond comparison text' },
      product_slugs: { type: 'product', label: 'Pin specific moissanite products' },
      cta_text: { type: 'text', label: 'CTA button text' },
      cta_link: { type: 'text', label: 'CTA link' },
      color_scheme: { type: 'color_scheme', label: 'Colour scheme' },
    },
  },

  /**
   * category-copy-editor
   * Lets staff edit the hero title, subtitle, and background image that
   * appear at the top of each /collections/:category page — without any
   * code changes. One block per category. The CMS patch pushes this to
   * forge-content.json which the React app reads at runtime.
   */
  'category-copy-editor': {
    type: 'category-copy-editor',
    name: 'Category Page Copy',
    description: 'Edit the hero title, subtitle, and image for each collection page — no code needed',
    icon: 'Pencil',
    category: 'products',
    defaultSettings: {
      rings_title: 'Rings',
      rings_subtitle: 'Moissanite, lab diamond, and CZ rings — every style, every budget.',
      rings_image: '/images/categories/rings.jpg',
      necklaces_title: 'Necklaces',
      necklaces_subtitle: 'Rope chains, tennis necklaces, pendants and more — built to be worn every day.',
      necklaces_image: '/images/categories/necklaces.jpg',
      bracelets_title: 'Bracelets',
      bracelets_subtitle: 'Cuban links, tennis bracelets, and iced-out styles. Worn every day. Noticed every time.',
      bracelets_image: '/images/categories/bracelets.jpg',
      earrings_title: 'Earrings',
      earrings_subtitle: 'Studs, hoops, and drops — frame your face in gold.',
      earrings_image: '/images/categories/earrings.jpg',
      pendants_title: 'Pendants',
      pendants_subtitle: 'Cross pendants, letter initials, iced-out medallions. Pair with any chain.',
      pendants_image: '/images/categories/pendants.jpg',
      anklets_title: 'Anklets',
      anklets_subtitle: 'Delicate chains, charm anklets, and Cuban links for the ankle. Summer-ready, year-round wearable.',
      anklets_image: '/images/categories/anklets.jpg',
    },
    schema: {
      rings_title: { type: 'text', label: 'Rings — Page Title' },
      rings_subtitle: { type: 'textarea', label: 'Rings — Subtitle' },
      rings_image: { type: 'image', label: 'Rings — Hero Image' },
      necklaces_title: { type: 'text', label: 'Necklaces — Page Title' },
      necklaces_subtitle: { type: 'textarea', label: 'Necklaces — Subtitle' },
      necklaces_image: { type: 'image', label: 'Necklaces — Hero Image' },
      bracelets_title: { type: 'text', label: 'Bracelets — Page Title' },
      bracelets_subtitle: { type: 'textarea', label: 'Bracelets — Subtitle' },
      bracelets_image: { type: 'image', label: 'Bracelets — Hero Image' },
      earrings_title: { type: 'text', label: 'Earrings — Page Title' },
      earrings_subtitle: { type: 'textarea', label: 'Earrings — Subtitle' },
      earrings_image: { type: 'image', label: 'Earrings — Hero Image' },
      pendants_title: { type: 'text', label: 'Pendants — Page Title' },
      pendants_subtitle: { type: 'textarea', label: 'Pendants — Subtitle' },
      pendants_image: { type: 'image', label: 'Pendants — Hero Image' },
      anklets_title: { type: 'text', label: 'Anklets — Page Title' },
      anklets_subtitle: { type: 'textarea', label: 'Anklets — Subtitle' },
      anklets_image: { type: 'image', label: 'Anklets — Hero Image' },
    },
  },

  /**
   * product-badge-settings
   * A global settings section that controls store-wide badge behaviour:
   * which categories show the GRA certification callout, what the
   * savings badge threshold is, and which badge labels to use.
   * This section doesn't render content directly — it writes to the
   * CMS JSON as a settings object the React app reads.
   */
  'product-badge-settings': {
    type: 'product-badge-settings',
    name: 'Product Badge Settings',
    description: 'Global settings for product badges — GRA callout, savings %, badge labels',
    icon: 'Settings',
    category: 'conversion',
    defaultSettings: {
      show_gra_callout: true,
      gra_categories: 'rings,pendants',
      gra_materials_keyword: 'moissanite',
      show_savings_badge: true,
      savings_badge_min_percent: 10,
      new_badge_label: 'New',
      sale_badge_label: 'Sale',
      bestseller_badge_label: 'Best Seller',
      limited_badge_label: 'Limited',
      badge_bg_color: '#C5A059',
      badge_text_color: '#000000',
    },
    schema: {
      show_gra_callout: { type: 'toggle', label: 'Show GRA certificate callout on moissanite products' },
      gra_materials_keyword: { type: 'text', label: 'GRA trigger keyword in materials field (e.g. moissanite)' },
      gra_categories: { type: 'text', label: 'GRA callout categories (comma-separated, e.g. rings,pendants)' },
      show_savings_badge: { type: 'toggle', label: 'Show discount % badge on product cards' },
      savings_badge_min_percent: { type: 'number', label: 'Minimum % to show savings badge', min: 1, max: 99 },
      new_badge_label: { type: 'text', label: '"New" badge label' },
      sale_badge_label: { type: 'text', label: '"Sale" badge label' },
      bestseller_badge_label: { type: 'text', label: '"Best Seller" badge label' },
      limited_badge_label: { type: 'text', label: '"Limited" badge label' },
      badge_bg_color: { type: 'color', label: 'Badge background colour' },
      badge_text_color: { type: 'color', label: 'Badge text colour' },
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