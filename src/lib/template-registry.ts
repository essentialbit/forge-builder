/**
 * Template Registry — Forge Builder
 *
 * Pre-built page layouts staff can apply in one click. Each template
 * is a complete page definition: ordered section IDs → section data.
 *
 * Templates are "stamp" operations — they replace the current page's
 * sections with the template sections, then the user customises from there.
 *
 * Adding a new template:
 *   1. Add a PageTemplate entry to PAGE_TEMPLATES.
 *   2. The UI reads this registry automatically — no UI changes needed.
 */

import type { Section } from '@/types/builder';

// ── Template shape ────────────────────────────────────────────────────────────

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Thumbnail preview image URL */
  thumbnail: string;
  /** Which kind of page this suits (for filtering) */
  category: 'homepage' | 'collection' | 'product' | 'about' | 'landing';
  /** Tag labels shown as chips on the card */
  tags: string[];
  /** The actual sections — stamped onto the page on apply */
  sections: Omit<Section, 'id'>[];
}

// ── Helper to generate stable fake IDs for template sections ─────────────────
// Real IDs are assigned by the builder store on apply; these are placeholders.
let _idx = 1;
const tid = () => `tpl_${String(_idx++).padStart(3, '0')}`;

// ── Templates ─────────────────────────────────────────────────────────────────

export const PAGE_TEMPLATES: PageTemplate[] = [

  // ────────────────────────────────────────────────────────────────────────────
  // 1. JEWELLERY STORE — full homepage
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'jewellery-homepage',
    name: 'Jewellery Store Homepage',
    description: 'Complete homepage for a luxury jewellery brand — announcement, hero, savings strip, category showcase, new arrivals, promo banner, reviews, and newsletter.',
    icon: 'Gem',
    thumbnail: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
    category: 'homepage',
    tags: ['Jewellery', 'Luxury', 'Full page'],
    sections: [
      {
        type: 'announcement',
        name: 'Announcement Bar',
        settings: {
          text: 'Free shipping on orders over A$100  ·  Use code FORGE10 for 10% off  ·  30-day returns',
          link: '/shipping',
          background_color: '#0a0a0a',
          text_color: '#C5A059',
          dismissible: true,
        },
      },
      {
        type: 'hero',
        name: 'Hero',
        settings: {
          headline: 'Iced Out. Built to Last.',
          subheadline: 'Premium 18K gold-plated jewellery — tarnish-free, waterproof, and worn every day.',
          cta_text: 'Shop New Arrivals',
          cta_link: '/collections/all',
          background_image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80',
          overlay_opacity: 50,
          text_alignment: 'center',
          height: 'large',
          animation: 'fade-up',
          color_scheme: '',
        },
      },
      {
        type: 'savings-strip',
        name: 'Savings Strip',
        settings: {
          items: [
            'Free shipping on orders over A$100',
            'Save 20–31% on new arrivals',
            'GRA certified moissanite',
            '30-day hassle-free returns',
            'Tarnish-free guarantee',
          ],
          background_color: '#C5A059',
          text_color: '#000000',
          separator: '·',
          scrolling: false,
          scroll_speed: 'normal',
        },
      },
      {
        type: 'trust-badges',
        name: 'Trust Badges',
        settings: { title: '' },
        blocks: [
          { id: tid(), type: 'trust_badge', settings: { icon: 'ShieldCheck', label: 'Secure Checkout', link: '/security' } },
          { id: tid(), type: 'trust_badge', settings: { icon: 'Truck', label: 'Free Shipping $100+', link: '/shipping' } },
          { id: tid(), type: 'trust_badge', settings: { icon: 'RefreshCw', label: '30-Day Returns', link: '/returns' } },
          { id: tid(), type: 'trust_badge', settings: { icon: 'Award', label: 'GRA Certified', link: '/moissanite' } },
        ],
      },
      {
        type: 'category-showcase',
        name: 'Shop by Category',
        settings: {
          title: 'Shop by Category',
          subtitle: 'Find your perfect piece',
          category_slugs: ['rings', 'necklaces', 'bracelets', 'earrings', 'pendants', 'anklets'],
          display_mode: 'grid',
        },
      },
      {
        type: 'new-arrivals',
        name: 'New Arrivals',
        settings: {
          title: 'New Arrivals',
          subtitle: 'Fresh from our latest sourcing run — just landed.',
          max_products: 8,
          columns: 4,
          auto_populate: true,
          show_compare_price: true,
          show_savings_badge: true,
          cta_text: 'View all new arrivals',
          cta_link: '/collections/all',
          color_scheme: '',
        },
      },
      {
        type: 'product-grid',
        name: 'Featured Products',
        settings: {
          title: 'Customer Favourites',
          subtitle: 'Our best-selling pieces — worn every day by thousands of Australians.',
          collection_handle: '',
          product_slugs: [],
          columns: 4,
          show_prices: true,
          show_compare_price: true,
          show_savings_badge: true,
          show_add_to_cart: true,
          badge_filter: 'bestseller',
        },
      },
      {
        type: 'testimonials',
        name: 'Reviews',
        settings: { title: 'What Our Customers Say' },
        blocks: [
          { id: tid(), type: 'testimonial_card', settings: { quote: 'Absolutely stunning quality. Wore it every day for 6 months and it still looks brand new.', author: 'Sarah M.', rating: 5, avatar_url: '' } },
          { id: tid(), type: 'testimonial_card', settings: { quote: 'The moissanite ring is unreal. Everyone thinks it\'s a real diamond. GRA cert sealed the deal for me.', author: 'James T.', rating: 5, avatar_url: '' } },
          { id: tid(), type: 'testimonial_card', settings: { quote: 'Fast shipping, beautiful packaging, and the bracelet is exactly as described. Will be back.', author: 'Priya L.', rating: 5, avatar_url: '' } },
        ],
      },
      {
        type: 'moissanite-showcase',
        name: 'Moissanite Showcase',
        settings: {
          title: 'VVS1 Moissanite — GRA Certified',
          subtitle: 'The same fire as diamonds. A fraction of the price.',
          columns: 3,
          show_gra_strip: true,
          gra_heading: 'GRA Certified Moissanite',
          gra_body: 'Every moissanite piece comes with a GRA certificate. VVS1 D-Colour — the same refractive index as diamond, cut to the same proportions.',
          show_diamond_comparison: true,
          diamond_comparison_text: 'A 1ct diamond ring: $5,000–$15,000. Our 1ct moissanite ring: under $100.',
          product_slugs: [],
          cta_text: 'Shop Moissanite',
          cta_link: '/collections/rings',
          color_scheme: '',
        },
      },
      {
        type: 'comparison-table',
        name: 'Why Choose Forge',
        settings: {
          title: 'Why Choose Forge?',
          subtitle: 'We\'re not just cheaper. We\'re genuinely better.',
          us_label: 'Forge Jewellery',
          them_label: 'Competitors',
        },
        blocks: [
          { id: tid(), type: 'comparison_row', settings: { feature: 'Tarnish-Free Guarantee', us_value: '✓ Lifetime', them_value: '✗ No' } },
          { id: tid(), type: 'comparison_row', settings: { feature: 'GRA Certified Stones', us_value: '✓ Every piece', them_value: '✗ Rarely' } },
          { id: tid(), type: 'comparison_row', settings: { feature: 'Waterproof', us_value: '✓ Yes', them_value: '✗ Often not' } },
          { id: tid(), type: 'comparison_row', settings: { feature: '30-Day Returns', us_value: '✓ No questions', them_value: '? Varies' } },
        ],
      },
      {
        type: 'newsletter',
        name: 'Newsletter',
        settings: {
          heading: 'Join the Forge Club',
          description: 'Get first access to new arrivals, exclusive discounts, and styling inspiration.',
          button_text: 'Subscribe',
          list_id: 'newsletter',
        },
        blocks: [
          { id: tid(), type: 'newsletter_social_link', settings: { label: 'Instagram', url: 'https://instagram.com/forgejewellery' } },
          { id: tid(), type: 'newsletter_social_link', settings: { label: 'TikTok', url: 'https://tiktok.com/@forgejewellery' } },
        ],
      },
      {
        type: 'footer',
        name: 'Footer',
        settings: { copyright_text: '© 2026 Forge Jewellery. All rights reserved.' },
        blocks: [
          {
            id: tid(), type: 'footer_column', settings: {
              heading: 'Shop',
              links: [
                { label: 'Necklaces', url: '/collections/necklaces' },
                { label: 'Bracelets', url: '/collections/bracelets' },
                { label: 'Rings', url: '/collections/rings' },
                { label: 'Earrings', url: '/collections/earrings' },
                { label: 'Pendants', url: '/collections/pendants' },
                { label: 'Anklets', url: '/collections/anklets' },
              ],
            },
          },
          {
            id: tid(), type: 'footer_column', settings: {
              heading: 'Help',
              links: [
                { label: 'Shipping & Returns', url: '/shipping' },
                { label: 'Ring Size Guide', url: '/size-guide' },
                { label: 'FAQ', url: '/faq' },
                { label: 'Contact Us', url: '/contact' },
              ],
            },
          },
          {
            id: tid(), type: 'footer_column', settings: {
              heading: 'Company',
              links: [
                { label: 'About Us', url: '/about' },
                { label: 'Blog', url: '/blog' },
                { label: 'Privacy Policy', url: '/privacy' },
                { label: 'Terms of Service', url: '/terms' },
              ],
            },
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 2. COLLECTION PAGE — category listing
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'collection-page',
    name: 'Collection / Category Page',
    description: 'Category hero with editorial copy, product grid, and FAQ — perfect for /collections/:category.',
    icon: 'LayoutGrid',
    thumbnail: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80',
    category: 'collection',
    tags: ['Collection', 'Category', 'Filtering'],
    sections: [
      {
        type: 'announcement',
        name: 'Announcement Bar',
        settings: {
          text: 'Free shipping on orders over A$100  ·  30-day returns',
          link: '',
          background_color: '#0a0a0a',
          text_color: '#C5A059',
          dismissible: true,
        },
      },
      {
        type: 'collection-hero',
        name: 'Collection Hero',
        settings: {
          collection_handle: 'necklaces',
          title: 'Necklaces',
          subtitle: 'Rope chains, tennis necklaces, pendants and more — built to be worn every day.',
          background_image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80',
          show_filters: true,
          show_sort: true,
          columns: 4,
        },
      },
      {
        type: 'savings-strip',
        name: 'Savings Strip',
        settings: {
          items: ['Free shipping over A$100', 'Save up to 31% on new arrivals', '30-day returns'],
          background_color: '#C5A059',
          text_color: '#000000',
          separator: '·',
          scrolling: false,
          scroll_speed: 'normal',
        },
      },
      {
        type: 'product-grid',
        name: 'All Products',
        settings: {
          title: '',
          subtitle: '',
          collection_handle: 'necklaces',
          product_slugs: [],
          columns: 4,
          show_prices: true,
          show_compare_price: true,
          show_savings_badge: true,
          show_add_to_cart: true,
          badge_filter: '',
        },
      },
      {
        type: 'trust-badges',
        name: 'Trust Badges',
        settings: { title: '' },
        blocks: [
          { id: tid(), type: 'trust_badge', settings: { icon: 'ShieldCheck', label: 'Secure Checkout', link: '' } },
          { id: tid(), type: 'trust_badge', settings: { icon: 'Truck', label: 'Free Shipping $100+', link: '' } },
          { id: tid(), type: 'trust_badge', settings: { icon: 'RefreshCw', label: '30-Day Returns', link: '' } },
        ],
      },
      {
        type: 'faq',
        name: 'FAQ',
        settings: { title: 'Frequently Asked Questions', subtitle: '' },
        blocks: [
          { id: tid(), type: 'faq_item', settings: { question: 'What are your chains made from?', answer: 'All chains are made from 316L surgical-grade stainless steel with 5-layer 18K gold PVD plating. They\'re tarnish-free, waterproof, and won\'t turn your skin green.' } },
          { id: tid(), type: 'faq_item', settings: { question: 'How long does shipping take?', answer: 'Standard shipping is 3–5 business days. Express is 1–2 business days. Free standard shipping on all orders over A$100.' } },
          { id: tid(), type: 'faq_item', settings: { question: 'Can I return if it doesn\'t suit?', answer: 'Yes — 30-day no-questions-asked returns on unworn items. Contact us and we\'ll arrange a prepaid return label.' } },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 3. PRODUCT DETAIL PAGE
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'product-detail',
    name: 'Product Detail Page',
    description: 'Full product page with gallery, price, add to cart, size guide, related products, and reviews.',
    icon: 'ShoppingBag',
    thumbnail: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80',
    category: 'product',
    tags: ['Product', 'PDP', 'Reviews'],
    sections: [
      {
        type: 'announcement',
        name: 'Announcement Bar',
        settings: {
          text: 'Free shipping on orders over A$100',
          link: '',
          background_color: '#0a0a0a',
          text_color: '#C5A059',
          dismissible: true,
        },
      },
      {
        type: 'product-detail-hero',
        name: 'Product Detail',
        settings: {
          product_slugs: [],
          show_reviews: true,
          show_size_guide: true,
          show_afterpay: true,
          layout: 'left',
          color_scheme: '',
        },
      },
      {
        type: 'trust-badges',
        name: 'Trust Badges',
        settings: { title: '' },
        blocks: [
          { id: tid(), type: 'trust_badge', settings: { icon: 'ShieldCheck', label: 'Secure Checkout', link: '' } },
          { id: tid(), type: 'trust_badge', settings: { icon: 'Truck', label: 'Free Shipping $100+', link: '' } },
          { id: tid(), type: 'trust_badge', settings: { icon: 'RefreshCw', label: '30-Day Returns', link: '' } },
          { id: tid(), type: 'trust_badge', settings: { icon: 'Award', label: 'GRA Certified', link: '' } },
        ],
      },
      {
        type: 'product-grid',
        name: 'You May Also Like',
        settings: {
          title: 'You May Also Like',
          subtitle: '',
          collection_handle: '',
          product_slugs: [],
          columns: 4,
          show_prices: true,
          show_compare_price: true,
          show_savings_badge: true,
          show_add_to_cart: true,
          badge_filter: '',
        },
      },
      {
        type: 'testimonials',
        name: 'Reviews',
        settings: { title: 'Customer Reviews' },
        blocks: [
          { id: tid(), type: 'testimonial_card', settings: { quote: 'Exactly as described. Arrived beautifully packaged.', author: 'Verified Buyer', rating: 5, avatar_url: '' } },
        ],
      },
      {
        type: 'faq',
        name: 'Product FAQ',
        settings: { title: 'Product Questions', subtitle: '' },
        blocks: [
          { id: tid(), type: 'faq_item', settings: { question: 'Is this waterproof?', answer: 'Yes — all our pieces are safe to wear in the shower, pool, and ocean. 316L stainless steel with PVD coating is highly resistant to water and sweat.' } },
          { id: tid(), type: 'faq_item', settings: { question: 'Will the gold fade?', answer: 'Our PVD plating is 5× thicker than standard gold plating and is applied under vacuum. It\'s extremely durable — no flaking, fading, or tarnishing.' } },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 4. FLASH SALE LANDING PAGE
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'flash-sale',
    name: 'Flash Sale Landing Page',
    description: 'High-conversion sale page with countdown timer, savings strip, product grid, and urgency comparison table.',
    icon: 'Tag',
    thumbnail: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
    category: 'landing',
    tags: ['Sale', 'Conversion', 'Countdown'],
    sections: [
      {
        type: 'promo-banner',
        name: 'Promo Banner',
        settings: {
          eyebrow: 'Flash Sale',
          headline: 'Up to 31% Off — Today Only',
          body: 'Our biggest sale of the year. All new arrivals, all categories. Prices drop at midnight.',
          cta_text: 'Shop the Sale',
          cta_link: '/collections/all',
          secondary_cta_text: 'View New Arrivals',
          secondary_cta_link: '/collections/all?badge=new',
          background_image_url: '',
          background_color: '#111111',
          accent_color: '#C5A059',
          text_color: '#ffffff',
          layout: 'centered',
          show_countdown: true,
          countdown_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      {
        type: 'savings-strip',
        name: 'Savings Strip',
        settings: {
          items: [
            'Up to 31% off sitewide',
            'Free shipping on all orders today',
            'GRA certified moissanite from A$65',
            'Ends at midnight',
          ],
          background_color: '#C5A059',
          text_color: '#000000',
          separator: '★',
          scrolling: true,
          scroll_speed: 'normal',
        },
      },
      {
        type: 'new-arrivals',
        name: 'Sale Products',
        settings: {
          title: 'Sale Products',
          subtitle: 'All items below are discounted — savings shown on each card.',
          max_products: 12,
          columns: 4,
          auto_populate: true,
          show_compare_price: true,
          show_savings_badge: true,
          cta_text: 'View all sale products',
          cta_link: '/collections/all',
        },
      },
      {
        type: 'countdown-timer',
        name: 'Countdown Timer',
        settings: {
          title: 'Sale Ends In',
          subtitle: 'Don\'t miss out — prices return to normal at midnight.',
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          background_color: '#111111',
          accent_color: '#C5A059',
          redirect_url: '',
        },
      },
      {
        type: 'trust-badges',
        name: 'Trust Badges',
        settings: { title: '' },
        blocks: [
          { id: tid(), type: 'trust_badge', settings: { icon: 'ShieldCheck', label: 'Secure Checkout', link: '' } },
          { id: tid(), type: 'trust_badge', settings: { icon: 'Truck', label: 'Free Shipping Today', link: '' } },
          { id: tid(), type: 'trust_badge', settings: { icon: 'RefreshCw', label: '30-Day Returns', link: '' } },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 5. MOISSANITE LANDING PAGE
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'moissanite-landing',
    name: 'Moissanite Landing Page',
    description: 'Education-first landing page for moissanite shoppers — GRA certification, diamond comparison, and product grid.',
    icon: 'Gem',
    thumbnail: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80',
    category: 'landing',
    tags: ['Moissanite', 'Education', 'Rings'],
    sections: [
      {
        type: 'hero',
        name: 'Hero',
        settings: {
          headline: 'VVS1 Moissanite',
          subheadline: 'GRA certified. More brilliant than diamond. Under $100.',
          cta_text: 'Shop Rings',
          cta_link: '/collections/rings',
          background_image_url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1920&q=80',
          overlay_opacity: 55,
          text_alignment: 'center',
          height: 'large',
          animation: 'fade-up',
        },
      },
      {
        type: 'moissanite-showcase',
        name: 'Moissanite Showcase',
        settings: {
          title: 'Why Moissanite?',
          subtitle: 'More brilliance. More fire. More accessible. Every stone is GRA certified VVS1 D-Colour.',
          columns: 3,
          show_gra_strip: true,
          gra_heading: 'GRA Certified — Every Stone',
          gra_body: 'The Gemological Research Association independently tests every stone. VVS1 D-Colour is the highest grade — colourless, near-flawless, and indistinguishable from diamond to the naked eye.',
          show_diamond_comparison: true,
          diamond_comparison_text: 'A 1ct natural diamond: A$8,000–$20,000. Our 1ct VVS1 moissanite ring: A$78.',
          product_slugs: [],
          cta_text: 'Shop All Moissanite',
          cta_link: '/collections/rings',
        },
      },
      {
        type: 'comparison-table',
        name: 'Moissanite vs Diamond',
        settings: {
          title: 'Moissanite vs Diamond',
          subtitle: 'The differences are smaller than you think. The price difference is not.',
          us_label: 'Moissanite',
          them_label: 'Diamond',
        },
        blocks: [
          { id: tid(), type: 'comparison_row', settings: { feature: 'Refractive Index', us_value: '2.65 (higher than diamond)', them_value: '2.42' } },
          { id: tid(), type: 'comparison_row', settings: { feature: 'Brilliance', us_value: '✓ More than diamond', them_value: 'High' } },
          { id: tid(), type: 'comparison_row', settings: { feature: 'Hardness (Mohs)', us_value: '9.25', them_value: '10' } },
          { id: tid(), type: 'comparison_row', settings: { feature: '1ct equivalent price', us_value: 'A$78', them_value: 'A$8,000–$20,000' } },
          { id: tid(), type: 'comparison_row', settings: { feature: 'Ethically sourced', us_value: '✓ 100% lab grown', them_value: '? Varies' } },
          { id: tid(), type: 'comparison_row', settings: { feature: 'GRA Certified', us_value: '✓ Every stone', them_value: '✓ GIA (costs extra)' } },
        ],
      },
      {
        type: 'faq',
        name: 'Moissanite FAQ',
        settings: { title: 'Moissanite Questions', subtitle: '' },
        blocks: [
          { id: tid(), type: 'faq_item', settings: { question: 'Can people tell it\'s not a diamond?', answer: 'Not with the naked eye. Moissanite has a higher refractive index than diamond, meaning it\'s actually more brilliant. A jeweller with a loupe and specific tester can tell — the average person cannot.' } },
          { id: tid(), type: 'faq_item', settings: { question: 'What is GRA certification?', answer: 'GRA (Gemological Research Association) independently grades and certifies the quality of moissanite stones. Every stone we sell is VVS1 D-Colour — the highest clarity and colour grade available.' } },
          { id: tid(), type: 'faq_item', settings: { question: 'Does moissanite scratch or cloud over time?', answer: 'No. At 9.25 on the Mohs hardness scale, moissanite is highly scratch-resistant and will not cloud, yellow, or lose brilliance over time.' } },
        ],
      },
      {
        type: 'testimonials',
        name: 'Customer Reviews',
        settings: { title: 'What Customers Say About Our Moissanite' },
        blocks: [
          { id: tid(), type: 'testimonial_card', settings: { quote: 'I proposed with the moissanite ring and my fiancée loves it. She knows it\'s not diamond and doesn\'t care — it\'s gorgeous.', author: 'Daniel R.', rating: 5, avatar_url: '' } },
          { id: tid(), type: 'testimonial_card', settings: { quote: 'Three jewellers looked at it and couldn\'t tell. The GRA cert is a nice touch — feels legitimate and professional.', author: 'Mei L.', rating: 5, avatar_url: '' } },
          { id: tid(), type: 'testimonial_card', settings: { quote: 'Wore it in the pool, ocean, gym every day for 4 months. Still perfect. Best purchase I\'ve made.', author: 'Tom B.', rating: 5, avatar_url: '' } },
        ],
      },
    ],
  },

];

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getTemplate(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: PageTemplate['category']): PageTemplate[] {
  return PAGE_TEMPLATES.filter((t) => t.category === category);
}

export const TEMPLATE_CATEGORIES: Array<{ id: PageTemplate['category']; label: string; icon: string }> = [
  { id: 'homepage',   label: 'Homepage',    icon: 'Home'       },
  { id: 'collection', label: 'Collection',  icon: 'LayoutGrid' },
  { id: 'product',    label: 'Product',     icon: 'ShoppingBag'},
  { id: 'landing',    label: 'Landing',     icon: 'Zap'        },
  { id: 'about',      label: 'About',       icon: 'Info'       },
];
