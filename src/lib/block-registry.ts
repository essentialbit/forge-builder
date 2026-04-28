/**
 * Block registry — typed sub-components that can nest inside sections.
 * Block = smallest editable unit. Shopify "section blocks" parity.
 *
 * Sections declare which block types they accept via `blocks: BlockDefinition[]`.
 * The Inspector renders a block editor when a section has blocks defined.
 */
import { BlockDefinition } from '@/types/builder';

export const blockRegistry: Record<string, BlockDefinition> = {
  testimonial_card: {
    type: 'testimonial_card',
    name: 'Testimonial',
    icon: 'MessageCircle',
    defaultSettings: {
      quote: 'This product is absolutely stunning. Best purchase I have ever made.',
      author: 'Customer Name',
      rating: 5,
      avatar_url: '',
    },
    schema: {
      quote: { type: 'textarea', label: 'Quote' },
      author: { type: 'text', label: 'Author name' },
      rating: { type: 'number', label: 'Stars', min: 1, max: 5 },
      avatar_url: { type: 'image', label: 'Avatar URL' },
    },
  },

  faq_item: {
    type: 'faq_item',
    name: 'Question',
    icon: 'HelpCircle',
    defaultSettings: {
      question: 'What is your return policy?',
      answer: 'We offer 30-day no-questions-asked returns on all items.',
    },
    schema: {
      question: { type: 'text', label: 'Question' },
      answer: { type: 'textarea', label: 'Answer' },
    },
  },

  trust_badge: {
    type: 'trust_badge',
    name: 'Badge',
    icon: 'Shield',
    defaultSettings: {
      icon: 'ShieldCheck',
      label: 'Secure Checkout',
      link: '/security',
    },
    schema: {
      icon: {
        type: 'select',
        label: 'Icon',
        options: [
          { label: 'Shield check', value: 'ShieldCheck' },
          { label: 'Truck', value: 'Truck' },
          { label: 'Refresh', value: 'RefreshCw' },
          { label: 'Headphones', value: 'Headphones' },
          { label: 'Lock', value: 'Lock' },
          { label: 'Award', value: 'Award' },
          { label: 'Thumbs up', value: 'ThumbsUp' },
        ],
      },
      label: { type: 'text', label: 'Label' },
      link: { type: 'text', label: 'Link URL' },
    },
  },

  footer_link: {
    type: 'footer_link',
    name: 'Link',
    icon: 'Link',
    defaultSettings: {
      label: 'Link text',
      url: '/',
    },
    schema: {
      label: { type: 'text', label: 'Label' },
      url: { type: 'text', label: 'URL' },
    },
  },

  footer_column: {
    type: 'footer_column',
    name: 'Column',
    icon: 'AlignLeft',
    defaultSettings: {
      heading: 'Column heading',
      links: [
        { label: 'Link 1', url: '/' },
        { label: 'Link 2', url: '/' },
      ],
    },
    schema: {
      heading: { type: 'text', label: 'Column heading' },
      links: { type: 'array', label: 'Links' },
    },
  },

  newsletter_social_link: {
    type: 'newsletter_social_link',
    name: 'Social link',
    icon: 'Share2',
    defaultSettings: {
      label: 'Instagram',
      url: 'https://instagram.com',
    },
    schema: {
      label: { type: 'text', label: 'Platform' },
      url: { type: 'text', label: 'URL' },
    },
  },

  comparison_row: {
    type: 'comparison_row',
    name: 'Comparison Row',
    icon: 'GitCompare',
    defaultSettings: {
      feature: 'Tarnish-Free Guarantee',
      us_value: '✓ Yes — lifetime',
      them_value: '✗ No',
    },
    schema: {
      feature: { type: 'text', label: 'Feature' },
      us_value: { type: 'text', label: 'Our Value' },
      them_value: { type: 'text', label: 'Their Value' },
    },
  },
};

// BlockType is derived from the registry — adding a key here automatically extends the type
export type BlockType = keyof typeof blockRegistry;

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return blockRegistry[type];
}