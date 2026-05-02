/**
 * Forge Builder — Industry Intelligence Templates
 *
 * A comprehensive library of website templates for 15+ industries.
 * Each template includes:
 *   - Keyword patterns for AI intent detection
 *   - Pre-configured sections with realistic default content
 *   - Brand theme suggestions
 *   - Multi-page structure
 *
 * Used by:
 *   - /api/ai/build-from-prompt — server-side prompt-to-site pipeline
 *   - Home page Quick Build pills
 *   - AI agent "build me a ..." responses
 */

import type { SectionType } from '@/types/builder';

// ── Types ─────────────────────────────────────────────────────────────────

export type IndustryKey =
  | 'restaurant' | 'ecommerce' | 'portfolio' | 'blog'
  | 'healthcare' | 'fitness' | 'realestate' | 'education'
  | 'event' | 'saas' | 'legal' | 'agency' | 'jewellery'
  | 'nonprofit' | 'hotel';

export interface IndustryMeta {
  id: IndustryKey;
  name: string;
  emoji: string;
  description: string;
  keywords: string[];
  palette: { primary: string; secondary: string; accent: string };
  fontFamily: string;
}

export interface TemplateSectionDef {
  type: SectionType;
  name: string;
  settings: Record<string, unknown>;
}

export interface IndustryTemplate {
  industry: IndustryKey;
  pages: Array<{
    id: string;
    name: string;
    slug: string;
    sections: TemplateSectionDef[];
    seo?: { title?: string; description?: string };
  }>;
}

// ── Industry Metadata ─────────────────────────────────────────────────────

export const INDUSTRY_META: Record<IndustryKey, IndustryMeta> = {
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    emoji: '🍕',
    description: 'Restaurants, cafés, bars & food delivery',
    keywords: ['restaurant', 'café', 'cafe', 'food', 'menu', 'dining', 'kitchen', 'pizza', 'sushi', 'bistro', 'eatery', 'bar', 'pub', 'bakery', 'diner', 'grill'],
    palette: { primary: '#C0392B', secondary: '#1A0A00', accent: '#F5E6C8' },
    fontFamily: 'Playfair Display',
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce',
    emoji: '🛍️',
    description: 'Online stores, marketplaces & retail shops',
    keywords: ['shop', 'store', 'sell', 'product', 'cart', 'buy', 'retail', 'ecommerce', 'marketplace', 'boutique', 'goods', 'merchandise'],
    palette: { primary: '#6C63FF', secondary: '#1A1033', accent: '#FFD700' },
    fontFamily: 'Inter',
  },
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio',
    emoji: '💼',
    description: 'Personal portfolios, freelancers & creatives',
    keywords: ['portfolio', 'personal', 'freelance', 'designer', 'artist', 'photographer', 'creative', 'resume', 'cv', 'work', 'showcase'],
    palette: { primary: '#1A1A2E', secondary: '#16213E', accent: '#E94560' },
    fontFamily: 'Inter',
  },
  blog: {
    id: 'blog',
    name: 'Blog',
    emoji: '📰',
    description: 'Blogs, news, magazines & content sites',
    keywords: ['blog', 'news', 'articles', 'content', 'magazine', 'journal', 'media', 'publication', 'editorial', 'newsletter'],
    palette: { primary: '#2D3748', secondary: '#1A202C', accent: '#63B3ED' },
    fontFamily: 'Georgia',
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    emoji: '🏥',
    description: 'Clinics, hospitals, medical practices & wellness',
    keywords: ['clinic', 'hospital', 'medical', 'doctor', 'health', 'dental', 'therapy', 'wellness', 'pharmacy', 'specialist', 'patient', 'treatment'],
    palette: { primary: '#0077B6', secondary: '#023E8A', accent: '#90E0EF' },
    fontFamily: 'Inter',
  },
  fitness: {
    id: 'fitness',
    name: 'Fitness',
    emoji: '💪',
    description: 'Gyms, personal trainers, yoga & sports',
    keywords: ['gym', 'fitness', 'workout', 'yoga', 'crossfit', 'training', 'coach', 'sport', 'athletics', 'pilates', 'nutrition', 'health coach'],
    palette: { primary: '#FF6B35', secondary: '#1A1A1A', accent: '#FFD700' },
    fontFamily: 'Inter',
  },
  realestate: {
    id: 'realestate',
    name: 'Real Estate',
    emoji: '🏠',
    description: 'Property listings, agents & real estate agencies',
    keywords: ['real estate', 'property', 'homes', 'house', 'apartment', 'rent', 'buy', 'realtor', 'agent', 'listing', 'mortgage', 'condo'],
    palette: { primary: '#2C3E50', secondary: '#1A252F', accent: '#3498DB' },
    fontFamily: 'Inter',
  },
  education: {
    id: 'education',
    name: 'Education',
    emoji: '🎓',
    description: 'Schools, courses, academies & online learning',
    keywords: ['school', 'course', 'education', 'learn', 'academy', 'university', 'training', 'tutoring', 'elearning', 'class', 'teacher'],
    palette: { primary: '#4A90D9', secondary: '#1B2A4A', accent: '#FFC107' },
    fontFamily: 'Inter',
  },
  event: {
    id: 'event',
    name: 'Events',
    emoji: '🎊',
    description: 'Weddings, events, venues & celebrations',
    keywords: ['wedding', 'event', 'party', 'conference', 'venue', 'celebration', 'catering', 'wedding planner', 'banquet', 'ceremony'],
    palette: { primary: '#B8860B', secondary: '#1A0E00', accent: '#FFF8E7' },
    fontFamily: 'Playfair Display',
  },
  saas: {
    id: 'saas',
    name: 'SaaS / App',
    emoji: '⚙️',
    description: 'Software products, apps, tools & platforms',
    keywords: ['saas', 'software', 'app', 'tool', 'platform', 'dashboard', 'analytics', 'api', 'startup', 'tech', 'product', 'solution', 'cloud'],
    palette: { primary: '#7C3AED', secondary: '#1E1040', accent: '#06D6A0' },
    fontFamily: 'Inter',
  },
  legal: {
    id: 'legal',
    name: 'Law Firm',
    emoji: '⚖️',
    description: 'Law firms, attorneys, legal services',
    keywords: ['law', 'legal', 'attorney', 'lawyer', 'firm', 'court', 'justice', 'counsel', 'solicitor', 'litigation'],
    palette: { primary: '#1C1C1C', secondary: '#0A0A0A', accent: '#C5A028' },
    fontFamily: 'Georgia',
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    emoji: '🚀',
    description: 'Marketing agencies, design studios & consulting firms',
    keywords: ['agency', 'studio', 'consulting', 'marketing', 'digital agency', 'branding', 'creative agency', 'advertising', 'growth'],
    palette: { primary: '#FF3366', secondary: '#0D0D0D', accent: '#FFFF00' },
    fontFamily: 'Inter',
  },
  jewellery: {
    id: 'jewellery',
    name: 'Jewellery',
    emoji: '💎',
    description: 'Jewellery stores, diamonds, fine jewellery',
    keywords: ['jewellery', 'jewelry', 'ring', 'diamond', 'gold', 'necklace', 'bracelet', 'gemstone', 'moissanite', 'engagement'],
    palette: { primary: '#D4AF37', secondary: '#0a0a0a', accent: '#ffffff' },
    fontFamily: 'Inter',
  },
  nonprofit: {
    id: 'nonprofit',
    name: 'Non-profit',
    emoji: '❤️',
    description: 'Charities, foundations & non-profit organisations',
    keywords: ['nonprofit', 'charity', 'foundation', 'cause', 'donate', 'volunteer', 'ngo', 'mission', 'community', 'humanitarian'],
    palette: { primary: '#27AE60', secondary: '#1A3A1A', accent: '#FFFFFF' },
    fontFamily: 'Inter',
  },
  hotel: {
    id: 'hotel',
    name: 'Hotel',
    emoji: '🏨',
    description: 'Hotels, resorts, B&Bs & hospitality',
    keywords: ['hotel', 'hospitality', 'accommodation', 'resort', 'lodge', 'stay', 'booking', 'spa', 'suite', 'bed and breakfast'],
    palette: { primary: '#8B6914', secondary: '#0D0900', accent: '#F5E6C8' },
    fontFamily: 'Playfair Display',
  },
};

// ── Utility: Generate section ID ──────────────────────────────────────────

function sid(type: string, n: number): string {
  return `${type}-${n}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Industry Templates ────────────────────────────────────────────────────

export const INDUSTRY_TEMPLATES: Record<IndustryKey, IndustryTemplate> = {

  // ── Restaurant ──────────────────────────────────────────────────────────
  restaurant: {
    industry: 'restaurant',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Welcome — Fine Dining Experience', description: 'Exceptional cuisine in an unforgettable setting. Book your table today.' },
        sections: [
          { type: 'announcement', name: 'Announcement Bar', settings: { text: '🍽️ Now taking reservations for the weekend — Book your table today!', bgColor: '#C0392B', textColor: '#fff' } },
          { type: 'hero', name: 'Hero', settings: { headline: 'Where Every Meal Becomes a Memory', subheadline: 'Fresh ingredients, bold flavours, and a dining experience unlike any other.', ctaText: 'Reserve a Table', ctaLink: '#contact', backgroundImage: '', overlayOpacity: 0.5, textAlign: 'center', height: 'full' } },
          { type: 'trust-badges', name: 'Highlights', settings: { title: '' }, },
          { type: 'rich-text', name: 'Our Story', settings: { title: 'Crafted with Passion', content: 'Every dish on our menu tells a story — from locally sourced ingredients to traditional techniques passed down through generations. We believe great food brings people together.', align: 'center' } },
          { type: 'featured-products', name: 'Signature Dishes', settings: { title: 'Our Signature Dishes', subtitle: 'Favourites from the kitchen', columns: 3, showPrice: true } },
          { type: 'testimonials', name: 'Reviews', settings: { title: 'What Our Guests Say', layout: 'grid' } },
          { type: 'newsletter', name: 'Reservations / Contact', settings: { title: 'Book a Table', subtitle: 'Reserve your spot for an unforgettable evening', buttonText: 'Make a Reservation', inputPlaceholder: 'Your email address' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'The Restaurant', tagline: 'Fine dining, memorable moments', phone: '+1 (555) 123-4567', email: 'hello@restaurant.com', address: '123 Main Street, City, State' } },
        ],
      },
      {
        id: 'menu', name: 'Menu', slug: '/menu',
        seo: { title: 'Our Menu', description: 'Explore our seasonal menu featuring the finest local ingredients.' },
        sections: [
          { type: 'hero', name: 'Menu Hero', settings: { headline: 'Our Menu', subheadline: 'Seasonal dishes crafted with local ingredients', height: 'medium', textAlign: 'center' } },
          { type: 'product-grid', name: 'Menu Items', settings: { title: 'Starters & Mains', columns: 2, showPrice: true, showCategory: true } },
          { type: 'rich-text', name: 'Dietary Info', settings: { title: 'Dietary Requirements', content: 'We cater to all dietary needs. Please speak with our staff about vegetarian, vegan, gluten-free, or allergy requirements.' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'The Restaurant' } },
        ],
      },
    ],
  },

  // ── E-commerce ──────────────────────────────────────────────────────────
  ecommerce: {
    industry: 'ecommerce',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Shop Online — Premium Products', description: 'Discover our curated collection of premium products with fast shipping and easy returns.' },
        sections: [
          { type: 'announcement', name: 'Promo Bar', settings: { text: '🎉 Free shipping on orders over $50 — Shop Now', bgColor: '#6C63FF', textColor: '#fff' } },
          { type: 'hero', name: 'Hero', settings: { headline: 'Premium Quality, Delivered to Your Door', subheadline: 'Shop our curated collection with free returns and 30-day guarantee.', ctaText: 'Shop Now', ctaLink: '/collections', height: 'large', textAlign: 'center' } },
          { type: 'category-showcase', name: 'Categories', settings: { title: 'Shop by Category', columns: 3 } },
          { type: 'featured-products', name: 'Best Sellers', settings: { title: 'Best Sellers', subtitle: 'Our most loved products', columns: 4, showPrice: true, showBadges: true } },
          { type: 'trust-badges', name: 'Trust Signals', settings: { title: '' } },
          { type: 'new-arrivals', name: 'New Arrivals', settings: { title: 'New Arrivals', subtitle: 'Just landed in store', columns: 4 } },
          { type: 'testimonials', name: 'Reviews', settings: { title: 'Loved by Thousands', layout: 'grid' } },
          { type: 'newsletter', name: 'Newsletter', settings: { title: 'Get 10% Off Your First Order', subtitle: 'Subscribe for exclusive deals and new product alerts', buttonText: 'Subscribe', inputPlaceholder: 'Enter your email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'My Store' } },
        ],
      },
      {
        id: 'collections', name: 'Collections', slug: '/collections',
        sections: [
          { type: 'collection-hero', name: 'Collection Hero', settings: { title: 'All Products', subtitle: 'Browse our full collection' } },
          { type: 'product-grid', name: 'Products', settings: { columns: 4, showPrice: true, showFilters: true } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'My Store' } },
        ],
      },
    ],
  },

  // ── Portfolio ────────────────────────────────────────────────────────────
  portfolio: {
    industry: 'portfolio',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Creative Portfolio', description: 'Passionate designer and developer crafting beautiful digital experiences.' },
        sections: [
          { type: 'hero', name: 'Hero', settings: { headline: 'I Design & Build Digital Experiences', subheadline: 'Creative designer specialising in UI/UX, brand identity, and web development.', ctaText: 'View My Work', ctaLink: '#work', height: 'full', textAlign: 'left' } },
          { type: 'rich-text', name: 'About', settings: { title: 'About Me', content: "Hi, I'm a passionate creative professional with 8+ years of experience helping brands stand out online. I blend strategic thinking with beautiful design to create meaningful digital experiences.", align: 'left' } },
          { type: 'featured-products', name: 'Selected Work', settings: { title: 'Selected Work', subtitle: 'Recent projects', columns: 2 } },
          { type: 'trust-badges', name: 'Skills', settings: { title: 'What I Do' } },
          { type: 'testimonials', name: 'Testimonials', settings: { title: 'Client Reviews', layout: 'list' } },
          { type: 'newsletter', name: 'Contact', settings: { title: "Let's Work Together", subtitle: "Have a project in mind? I'd love to hear about it.", buttonText: 'Get in Touch', inputPlaceholder: 'Your email address' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'Your Name', tagline: 'Creative Designer & Developer' } },
        ],
      },
    ],
  },

  // ── Blog ─────────────────────────────────────────────────────────────────
  blog: {
    industry: 'blog',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Our Blog — Insights & Stories', description: 'Fresh perspectives, expert insights and compelling stories.' },
        sections: [
          { type: 'hero', name: 'Hero', settings: { headline: 'Ideas Worth Reading', subheadline: 'Fresh perspectives on technology, culture, and the future.', ctaText: 'Start Reading', ctaLink: '#articles', height: 'medium', textAlign: 'center' } },
          { type: 'featured-products', name: 'Featured Articles', settings: { title: 'Featured Stories', columns: 3, showPrice: false } },
          { type: 'product-grid', name: 'Latest Posts', settings: { title: 'Latest Posts', columns: 3, showPrice: false } },
          { type: 'newsletter', name: 'Newsletter', settings: { title: 'Stay in the Loop', subtitle: 'Get our best stories delivered to your inbox weekly.', buttonText: 'Subscribe Free', inputPlaceholder: 'your@email.com' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'The Blog' } },
        ],
      },
    ],
  },

  // ── Healthcare ───────────────────────────────────────────────────────────
  healthcare: {
    industry: 'healthcare',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Healthcare Practice — Compassionate Care', description: 'Expert medical care in a warm, welcoming environment. Book your appointment online.' },
        sections: [
          { type: 'hero', name: 'Hero', settings: { headline: 'Your Health Is Our Priority', subheadline: 'Expert care from a team of experienced medical professionals committed to your wellbeing.', ctaText: 'Book an Appointment', ctaLink: '#contact', height: 'large', textAlign: 'center' } },
          { type: 'trust-badges', name: 'Credentials', settings: { title: 'Why Choose Us' } },
          { type: 'featured-products', name: 'Services', settings: { title: 'Our Services', subtitle: 'Comprehensive care for you and your family', columns: 3, showPrice: false } },
          { type: 'rich-text', name: 'About', settings: { title: 'About Our Practice', content: 'With over 20 years of experience, our dedicated team provides compassionate, evidence-based healthcare. We treat each patient as an individual and take the time to truly listen.' } },
          { type: 'testimonials', name: 'Patient Reviews', settings: { title: 'Patient Stories', layout: 'grid' } },
          { type: 'faq', name: 'FAQ', settings: { title: 'Frequently Asked Questions' } },
          { type: 'newsletter', name: 'Book Appointment', settings: { title: 'Book an Appointment', subtitle: "We'll confirm your appointment within 24 hours", buttonText: 'Request Appointment', inputPlaceholder: 'Your email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'Medical Practice', phone: '+1 (555) 000-0000', address: '123 Health Street, City' } },
        ],
      },
    ],
  },

  // ── Fitness ──────────────────────────────────────────────────────────────
  fitness: {
    industry: 'fitness',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Fitness Studio — Transform Your Life', description: 'Join our community and achieve your fitness goals with expert coaching and world-class facilities.' },
        sections: [
          { type: 'announcement', name: 'Promo', settings: { text: '🔥 FREE first class this week — Claim your spot now!', bgColor: '#FF6B35', textColor: '#fff' } },
          { type: 'hero', name: 'Hero', settings: { headline: 'Transform Your Body. Elevate Your Life.', subheadline: 'Join thousands of members who have changed their lives with expert coaching and a supportive community.', ctaText: 'Start Free Trial', ctaLink: '#pricing', height: 'full', textAlign: 'center' } },
          { type: 'trust-badges', name: 'Stats', settings: { title: '' } },
          { type: 'featured-products', name: 'Classes', settings: { title: 'Our Classes', subtitle: 'Something for every fitness level', columns: 3, showPrice: true } },
          { type: 'rich-text', name: 'About', settings: { title: 'Why Our Members Love Us', content: "We're not just a gym — we're a movement. Our certified trainers, state-of-the-art equipment, and empowering community help you reach goals you never thought possible." } },
          { type: 'testimonials', name: 'Transformations', settings: { title: 'Real Results from Real Members', layout: 'grid' } },
          { type: 'newsletter', name: 'Membership CTA', settings: { title: 'Ready to Start?', subtitle: 'Get your free trial pass — no commitment needed.', buttonText: 'Claim Free Pass', inputPlaceholder: 'Your email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'Fitness Studio' } },
        ],
      },
    ],
  },

  // ── Real Estate ──────────────────────────────────────────────────────────
  realestate: {
    industry: 'realestate',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Real Estate — Find Your Dream Home', description: 'Browse thousands of property listings with expert guidance at every step.' },
        sections: [
          { type: 'hero', name: 'Hero', settings: { headline: 'Find Your Perfect Home', subheadline: 'Browse exclusive listings with expert guidance from our award-winning team.', ctaText: 'Search Properties', ctaLink: '#listings', height: 'full', textAlign: 'center' } },
          { type: 'trust-badges', name: 'Stats', settings: { title: '' } },
          { type: 'featured-products', name: 'Featured Listings', settings: { title: 'Featured Properties', subtitle: 'Hand-picked by our experts', columns: 3, showPrice: true } },
          { type: 'rich-text', name: 'About', settings: { title: 'Why Work With Us', content: 'With 15+ years in the local market, our team of licensed real estate professionals will guide you through every step of your journey — from search to closing.' } },
          { type: 'testimonials', name: 'Testimonials', settings: { title: 'Happy Clients', layout: 'grid' } },
          { type: 'newsletter', name: 'Alerts', settings: { title: 'Get Property Alerts', subtitle: 'Be the first to know when new properties match your criteria.', buttonText: 'Set Up Alert', inputPlaceholder: 'Your email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'Real Estate Agency', phone: '+1 (555) 000-0000' } },
        ],
      },
    ],
  },

  // ── Education ────────────────────────────────────────────────────────────
  education: {
    industry: 'education',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Online Academy — Learn Something New Today', description: 'Expert-led courses designed to fast-track your skills and career.' },
        sections: [
          { type: 'announcement', name: 'Offer', settings: { text: '🎓 New courses starting next week — Enroll now and save 40%!', bgColor: '#4A90D9', textColor: '#fff' } },
          { type: 'hero', name: 'Hero', settings: { headline: 'Learn Skills That Matter', subheadline: 'Expert-led courses designed to transform your career and unlock new opportunities.', ctaText: 'Browse Courses', ctaLink: '#courses', height: 'large', textAlign: 'center' } },
          { type: 'trust-badges', name: 'Stats', settings: { title: '' } },
          { type: 'featured-products', name: 'Popular Courses', settings: { title: 'Popular Courses', subtitle: 'Start learning today', columns: 3, showPrice: true } },
          { type: 'testimonials', name: 'Student Reviews', settings: { title: 'Student Success Stories', layout: 'grid' } },
          { type: 'faq', name: 'FAQ', settings: { title: 'Frequently Asked Questions' } },
          { type: 'newsletter', name: 'Newsletter', settings: { title: 'Stay Updated', subtitle: 'Get notified about new courses and special offers.', buttonText: 'Stay Updated', inputPlaceholder: 'Your email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'Online Academy' } },
        ],
      },
    ],
  },

  // ── Events ───────────────────────────────────────────────────────────────
  event: {
    industry: 'event',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Event Planning — Creating Unforgettable Moments', description: 'From intimate gatherings to grand celebrations, we create perfect events.' },
        sections: [
          { type: 'hero', name: 'Hero', settings: { headline: 'Creating Unforgettable Moments', subheadline: 'From intimate gatherings to grand celebrations, we make your vision come to life.', ctaText: 'Plan Your Event', ctaLink: '#contact', height: 'full', textAlign: 'center' } },
          { type: 'trust-badges', name: 'Highlights', settings: { title: 'Why Choose Us' } },
          { type: 'featured-products', name: 'Services', settings: { title: 'Event Services', columns: 3, showPrice: false } },
          { type: 'testimonials', name: 'Reviews', settings: { title: 'Happy Clients', layout: 'grid' } },
          { type: 'countdown-timer', name: 'Next Event', settings: { title: 'Next Open Day', endDate: '', label: 'Until Our Next Open Day' } },
          { type: 'newsletter', name: 'Contact', settings: { title: "Let's Plan Your Event", subtitle: 'Tell us about your dream event and we\'ll be in touch.', buttonText: 'Get in Touch', inputPlaceholder: 'Your email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'Event Planning Co.' } },
        ],
      },
    ],
  },

  // ── SaaS ─────────────────────────────────────────────────────────────────
  saas: {
    industry: 'saas',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'The Platform That Grows With You', description: 'Powerful tools to help your team work smarter, faster, and more efficiently.' },
        sections: [
          { type: 'announcement', name: 'Banner', settings: { text: '🚀 Version 2.0 is here — See what\'s new', bgColor: '#7C3AED', textColor: '#fff' } },
          { type: 'hero', name: 'Hero', settings: { headline: 'Work Smarter. Ship Faster.', subheadline: 'The all-in-one platform that helps teams collaborate, automate, and deliver results at scale.', ctaText: 'Start Free Trial', ctaLink: '#pricing', height: 'large', textAlign: 'center' } },
          { type: 'trust-badges', name: 'Social Proof', settings: { title: 'Trusted by 10,000+ Teams' } },
          { type: 'featured-products', name: 'Features', settings: { title: 'Everything You Need', subtitle: 'Powerful features built for modern teams', columns: 3, showPrice: false } },
          { type: 'rich-text', name: 'How It Works', settings: { title: 'How It Works', content: 'Getting started takes minutes. Connect your tools, invite your team, and watch productivity soar. Our intuitive interface means zero learning curve.' } },
          { type: 'comparison-table', name: 'Compare Plans', settings: { title: 'Compare Plans' } },
          { type: 'testimonials', name: 'Reviews', settings: { title: 'Loved by Teams Worldwide', layout: 'grid' } },
          { type: 'faq', name: 'FAQ', settings: { title: 'Frequently Asked Questions' } },
          { type: 'newsletter', name: 'CTA', settings: { title: 'Ready to Transform How You Work?', subtitle: 'Start your 14-day free trial. No credit card required.', buttonText: 'Start Free Trial', inputPlaceholder: 'Work email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'SaaS Platform' } },
        ],
      },
    ],
  },

  // ── Legal ─────────────────────────────────────────────────────────────────
  legal: {
    industry: 'legal',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Law Firm — Expert Legal Counsel', description: 'Trusted legal expertise for individuals and businesses. Book a free consultation.' },
        sections: [
          { type: 'hero', name: 'Hero', settings: { headline: 'Expert Legal Counsel You Can Trust', subheadline: 'Experienced attorneys committed to protecting your rights and achieving the best possible outcome.', ctaText: 'Free Consultation', ctaLink: '#contact', height: 'large', textAlign: 'center' } },
          { type: 'trust-badges', name: 'Credentials', settings: { title: 'Why Choose Our Firm' } },
          { type: 'featured-products', name: 'Practice Areas', settings: { title: 'Practice Areas', columns: 3, showPrice: false } },
          { type: 'rich-text', name: 'About', settings: { title: 'About Our Firm', content: 'With decades of combined experience, our legal team has successfully represented thousands of clients. We combine deep expertise with personalised service to deliver results.' } },
          { type: 'testimonials', name: 'Client Testimonials', settings: { title: 'Client Testimonials', layout: 'list' } },
          { type: 'faq', name: 'FAQ', settings: { title: 'Common Legal Questions' } },
          { type: 'newsletter', name: 'Consultation', settings: { title: 'Book a Free Consultation', subtitle: 'Speak with an attorney at no cost. Available 24/7.', buttonText: 'Book Consultation', inputPlaceholder: 'Your email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'Law Firm' } },
        ],
      },
    ],
  },

  // ── Agency ────────────────────────────────────────────────────────────────
  agency: {
    industry: 'agency',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Creative Agency — We Build Brands That Win', description: 'Strategic branding, web design and digital marketing for ambitious businesses.' },
        sections: [
          { type: 'hero', name: 'Hero', settings: { headline: 'We Build Brands That Win', subheadline: 'Strategic design, digital marketing, and technology solutions for ambitious businesses ready to lead their market.', ctaText: 'Start a Project', ctaLink: '#contact', height: 'full', textAlign: 'center' } },
          { type: 'trust-badges', name: 'Clients', settings: { title: 'Trusted by Industry Leaders' } },
          { type: 'featured-products', name: 'Services', settings: { title: 'What We Do', columns: 3, showPrice: false } },
          { type: 'category-showcase', name: 'Work', settings: { title: 'Recent Work', columns: 3 } },
          { type: 'testimonials', name: 'Client Reviews', settings: { title: 'What Our Clients Say', layout: 'grid' } },
          { type: 'newsletter', name: 'Contact', settings: { title: "Let's Build Something Great", subtitle: "Tell us about your project and we'll get back to you within 24 hours.", buttonText: 'Start a Project', inputPlaceholder: 'Your email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'Creative Agency' } },
        ],
      },
    ],
  },

  // ── Jewellery ─────────────────────────────────────────────────────────────
  jewellery: {
    industry: 'jewellery',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Fine Jewellery — Crafted to Last a Lifetime', description: 'Discover exquisite jewellery crafted with ethically sourced stones and precious metals.' },
        sections: [
          { type: 'announcement', name: 'Promo', settings: { text: '✨ Free shipping on all orders over $99 + Free gift wrap', bgColor: '#D4AF37', textColor: '#000' } },
          { type: 'hero', name: 'Hero', settings: { headline: 'Jewellery That Tells Your Story', subheadline: 'Ethically crafted pieces using the finest stones, designed to be treasured for a lifetime.', ctaText: 'Shop Collection', ctaLink: '#collections', height: 'full', textAlign: 'center' } },
          { type: 'savings-strip', name: 'Benefits', settings: {} },
          { type: 'category-showcase', name: 'Collections', settings: { title: 'Shop by Collection', columns: 3 } },
          { type: 'featured-products', name: 'Bestsellers', settings: { title: 'Best Sellers', subtitle: 'Our most-loved pieces', columns: 4, showPrice: true } },
          { type: 'trust-badges', name: 'Trust', settings: { title: '' } },
          { type: 'testimonials', name: 'Reviews', settings: { title: 'What Our Customers Say', layout: 'grid' } },
          { type: 'newsletter', name: 'Newsletter', settings: { title: 'Join the Inner Circle', subtitle: 'Get early access to new collections and exclusive member offers.', buttonText: 'Subscribe', inputPlaceholder: 'Your email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'Fine Jewellery' } },
        ],
      },
    ],
  },

  // ── Non-profit ────────────────────────────────────────────────────────────
  nonprofit: {
    industry: 'nonprofit',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Making a Difference Together', description: 'Join our mission to create lasting change in communities around the world.' },
        sections: [
          { type: 'hero', name: 'Hero', settings: { headline: 'Together, We Can Change the World', subheadline: 'Join thousands of supporters making a real difference in communities around the globe.', ctaText: 'Donate Now', ctaLink: '#donate', height: 'full', textAlign: 'center' } },
          { type: 'trust-badges', name: 'Impact Stats', settings: { title: 'Our Impact' } },
          { type: 'rich-text', name: 'Mission', settings: { title: 'Our Mission', content: 'We exist to create sustainable change in underserved communities. Every donation, every volunteer hour, and every act of support brings us closer to a more equitable world.' } },
          { type: 'featured-products', name: 'Programs', settings: { title: 'Our Programs', subtitle: 'Where your support makes a difference', columns: 3, showPrice: false } },
          { type: 'testimonials', name: 'Stories', settings: { title: 'Stories of Change', layout: 'grid' } },
          { type: 'newsletter', name: 'Donate CTA', settings: { title: 'Support Our Mission', subtitle: 'Every contribution, large or small, changes a life.', buttonText: 'Donate Today', inputPlaceholder: 'Your email' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'The Foundation' } },
        ],
      },
    ],
  },

  // ── Hotel ─────────────────────────────────────────────────────────────────
  hotel: {
    industry: 'hotel',
    pages: [
      {
        id: 'home', name: 'Home', slug: '/',
        seo: { title: 'Luxury Hotel — Your Home Away From Home', description: 'Experience exceptional hospitality in our award-winning hotel. Book direct for best rates.' },
        sections: [
          { type: 'announcement', name: 'Offer', settings: { text: '🏨 Book direct for 15% off + complimentary breakfast', bgColor: '#8B6914', textColor: '#fff' } },
          { type: 'hero', name: 'Hero', settings: { headline: 'Your Perfect Escape Awaits', subheadline: 'Unwind in our luxurious rooms and suites, with world-class dining and spa experiences.', ctaText: 'Book Your Stay', ctaLink: '#booking', height: 'full', textAlign: 'center' } },
          { type: 'featured-products', name: 'Rooms & Suites', settings: { title: 'Rooms & Suites', subtitle: 'Discover your perfect retreat', columns: 3, showPrice: true } },
          { type: 'trust-badges', name: 'Amenities', settings: { title: 'Hotel Amenities' } },
          { type: 'rich-text', name: 'About', settings: { title: 'A World of Comfort', content: "Nestled in the heart of the city, our hotel combines timeless elegance with modern luxury. Every detail has been thoughtfully designed to ensure your stay is nothing short of extraordinary." } },
          { type: 'testimonials', name: 'Guest Reviews', settings: { title: 'Guest Reviews', layout: 'grid' } },
          { type: 'newsletter', name: 'Booking CTA', settings: { title: 'Ready to Book?', subtitle: 'Best rates guaranteed when you book direct.', buttonText: 'Book Now', inputPlaceholder: 'Your email for confirmation' } },
          { type: 'footer', name: 'Footer', settings: { businessName: 'Luxury Hotel' } },
        ],
      },
    ],
  },
};

// ── Intent Detection ──────────────────────────────────────────────────────

/**
 * Detect industry from a natural language prompt.
 * Returns 'ecommerce' as default for unrecognised prompts.
 */
export function detectIndustry(prompt: string): IndustryKey {
  const p = prompt.toLowerCase();

  // Score each industry
  const scores: Partial<Record<IndustryKey, number>> = {};

  for (const [id, meta] of Object.entries(INDUSTRY_META)) {
    let score = 0;
    for (const kw of meta.keywords) {
      if (p.includes(kw.toLowerCase())) {
        score += kw.includes(' ') ? 3 : 1; // multi-word phrases score higher
      }
    }
    if (score > 0) scores[id as IndustryKey] = score;
  }

  if (Object.keys(scores).length === 0) return 'ecommerce';

  // Return industry with highest score
  return Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0] as IndustryKey;
}

/**
 * Extract a website/business name from a prompt.
 * Falls back to a generic name based on industry.
 */
export function extractBusinessName(prompt: string, industry: IndustryKey): string {
  const patterns = [
    /for ["']([^"']+)['"]/i,
    /called ["']([^"']+)['"]/i,
    /named? ["']([^"']+)['"]/i,
    /["']([^"']{3,40})["'] (?:website|site|store|shop|platform)/i,
    /(?:build|create|make) (?:a |an )?(?:\w+ )?(?:for |called )?([A-Z][a-zA-Z\s&]{2,30})/,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  // Generate a sensible default
  const defaults: Record<IndustryKey, string> = {
    restaurant: 'The Restaurant',
    ecommerce: 'My Store',
    portfolio: 'My Portfolio',
    blog: 'The Blog',
    healthcare: 'Healthcare Practice',
    fitness: 'Fitness Studio',
    realestate: 'Real Estate Agency',
    education: 'Online Academy',
    event: 'Event Co.',
    saas: 'The Platform',
    legal: 'Law Firm',
    agency: 'Creative Agency',
    jewellery: 'Fine Jewellery',
    nonprofit: 'The Foundation',
    hotel: 'The Hotel',
  };

  return defaults[industry];
}

/**
 * Extract style/tone descriptors from a prompt.
 */
export function extractStyle(prompt: string): {
  tone: 'luxury' | 'friendly' | 'professional' | 'bold' | 'minimal';
  colorPreference?: string;
} {
  const p = prompt.toLowerCase();

  if (/luxury|premium|elegant|high.?end|exclusive/.test(p)) return { tone: 'luxury' };
  if (/fun|friendly|playful|casual|approachable/.test(p)) return { tone: 'friendly' };
  if (/bold|striking|dynamic|powerful|energetic/.test(p)) return { tone: 'bold' };
  if (/minimal|clean|simple|modern|sleek/.test(p)) return { tone: 'minimal' };
  return { tone: 'professional' };
}

/**
 * Get template for a given industry, with business name substituted.
 */
export function getTemplate(industry: IndustryKey, businessName: string): IndustryTemplate {
  const template = INDUSTRY_TEMPLATES[industry];
  const meta = INDUSTRY_META[industry];

  // Deep clone and substitute business name
  const substituted = JSON.parse(JSON.stringify(template)) as IndustryTemplate;

  for (const page of substituted.pages) {
    if (page.seo?.title) {
      page.seo.title = page.seo.title.replace(/My (?:Store|Website|Practice|Portfolio|Blog|Firm|Platform|Restaurant|Hotel|Academy)/g, businessName);
    }
    for (const section of page.sections) {
      // Replace generic business name placeholders in settings
      const settingsStr = JSON.stringify(section.settings)
        .replace(/Fine Jewellery|My Store|The Restaurant|Creative Agency|Online Academy|Law Firm|Fitness Studio|Real Estate Agency|Event Planning Co\.|SaaS Platform|The Foundation|Luxury Hotel|The Blog|My Portfolio/g, businessName);
      section.settings = JSON.parse(settingsStr);
    }
  }

  void meta; // meta is used for theme, returned separately via INDUSTRY_META[industry]
  return substituted;
}
