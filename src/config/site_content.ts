export const site_content = {
  studio_info: {
    studio_name: 'TODO_BUSINESS_STUDIO_NAME',
    tagline: 'TODO_BUSINESS_TAGLINE',
    short_description: 'TODO_BUSINESS_SHORT_DESCRIPTION',
    long_description: 'TODO_BUSINESS_LONG_DESCRIPTION',
  },

  navigation_items: [
    { label: 'Home', href: '/' },
    { label: 'Classes', href: '/classes' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Instructors', href: '/instructors' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
  ],

  account_links: {
    show_account_link: true,
    login_label: 'Login',
    login_href: 'TODO_BUSINESS_ACCOUNT_LOGIN_URL',
  },

  primary_cta: {
    label: 'Book Now',
    href: '/book',
  },

  secondary_cta: {
    label: 'View Classes',
    href: '/classes',
  },

  hero_content: {
    eyebrow: 'Pilates Studio',
    headline: 'TODO_HERO_HEADLINE',
    subheading: 'TODO_HERO_SUBHEADING',
    supporting_text: 'TODO_HERO_SUPPORTING_TEXT',
    primary_cta_label: 'Book Now',
    primary_cta_href: '/book',
    secondary_cta_label: 'View Classes',
    secondary_cta_href: '/classes',
    image_src: '/images/placeholders/hero-placeholder.jpg',
    image_alt: 'TODO_HERO_IMAGE_ALT',
  },

  studio_overview: {
    section_label: 'About the Studio',
    heading: 'A calm and focused space for movement',
    intro_text: 'TODO_BUSINESS_SHORT_DESCRIPTION',
    highlights: ['TODO_STUDIO_HIGHLIGHT_1', 'TODO_STUDIO_HIGHLIGHT_2', 'TODO_STUDIO_HIGHLIGHT_3'],
  },

  classes_preview: {
    section_label: 'Classes',
    heading: 'Find the class that fits your routine',
    intro_text:
      'Explore the main class types and choose the session that matches your level and schedule.',
    cta_label: 'View Classes',
    cta_href: '/classes',
    items: [
      {
        name: 'Reformer',
        description: 'TODO_CLASS_1_DESCRIPTION',
        duration: 'TODO_CLASS_1_DURATION',
        level: 'TODO_CLASS_1_LEVEL',
        capacity: 'TODO_CLASS_1_CAPACITY',
      },
      {
        name: 'Mat Pilates',
        description: 'TODO_CLASS_2_DESCRIPTION',
        duration: 'TODO_CLASS_2_DURATION',
        level: 'TODO_CLASS_2_LEVEL',
        capacity: 'TODO_CLASS_2_CAPACITY',
      },
      {
        name: 'Private Session',
        description: 'TODO_CLASS_3_DESCRIPTION',
        duration: 'TODO_CLASS_3_DURATION',
        level: 'TODO_CLASS_3_LEVEL',
        capacity: 'TODO_CLASS_3_CAPACITY',
      },
      {
        name: 'Intro Class',
        description: 'TODO_CLASS_4_DESCRIPTION',
        duration: 'TODO_CLASS_4_DURATION',
        level: 'TODO_CLASS_4_LEVEL',
        capacity: 'TODO_CLASS_4_CAPACITY',
      },
    ],
  },

  pricing_preview: {
    section_label: 'Pricing',
    heading: 'Simple pricing for getting started',
    intro_text: 'Start with an intro offer or choose the option that works best for your routine.',
    cta_label: 'View Pricing',
    cta_href: '/pricing',
    intro_offer: {
      title: 'Intro Offer',
      price: 'TODO_PRICING_INTRO_PRICE',
      description: 'TODO_PRICING_INTRO_DESCRIPTION',
    },
    plans: [
      {
        name: 'Single Class',
        price: 'TODO_PRICING_PACKAGE_1_PRICE',
        description: 'TODO_PRICING_PACKAGE_1_DESCRIPTION',
      },
      {
        name: 'Class Pack',
        price: 'TODO_PRICING_PACKAGE_2_PRICE',
        description: 'TODO_PRICING_PACKAGE_2_DESCRIPTION',
      },
      {
        name: 'Membership',
        price: 'TODO_PRICING_PACKAGE_3_PRICE',
        description: 'TODO_PRICING_PACKAGE_3_DESCRIPTION',
      },
    ],
    policies_short: 'TODO_PRICING_POLICIES_SHORT',
  },

  instructors_preview: {
    section_label: 'Instructors',
    heading: 'Meet the team',
    intro_text: 'Get to know the instructors who guide classes and support your progress.',
    cta_label: 'View Instructors',
    cta_href: '/instructors',
    items: [
      {
        name: 'TODO_INSTRUCTOR_1_NAME',
        role: 'Pilates Instructor',
        bio: 'TODO_INSTRUCTOR_1_BIO',
        image_src: '/images/placeholders/instructor-1.jpg',
        image_alt: 'TODO_INSTRUCTOR_1_IMAGE_ALT',
      },
      {
        name: 'TODO_INSTRUCTOR_2_NAME',
        role: 'Pilates Instructor',
        bio: 'TODO_INSTRUCTOR_2_BIO',
        image_src: '/images/placeholders/instructor-2.jpg',
        image_alt: 'TODO_INSTRUCTOR_2_IMAGE_ALT',
      },
      {
        name: 'TODO_INSTRUCTOR_3_NAME',
        role: 'Pilates Instructor',
        bio: 'TODO_INSTRUCTOR_3_BIO',
        image_src: '/images/placeholders/instructor-3.jpg',
        image_alt: 'TODO_INSTRUCTOR_3_IMAGE_ALT',
      },
    ],
  },

  contact_preview: {
    section_label: 'Contact',
    heading: 'Visit the studio',
    intro_text: 'Find the studio, get in touch, or use the booking link to reserve your class.',
    cta_label: 'Contact Us',
    cta_href: '/contact',
    phone: 'TODO_BUSINESS_PHONE',
    email: 'TODO_BUSINESS_EMAIL',
    address_line_1: 'TODO_BUSINESS_ADDRESS_LINE_1',
    address_line_2: 'TODO_BUSINESS_ADDRESS_LINE_2',
    city: 'TODO_BUSINESS_CITY',
    postcode: 'TODO_BUSINESS_POSTCODE',
    country: 'TODO_BUSINESS_COUNTRY',
    google_maps_url: 'TODO_BUSINESS_GOOGLE_MAPS_URL',
    hours: {
      weekday: 'TODO_BUSINESS_HOURS_WEEKDAY',
      saturday: 'TODO_BUSINESS_HOURS_SATURDAY',
      sunday: 'TODO_BUSINESS_HOURS_SUNDAY',
      note: 'TODO_BUSINESS_HOURS_NOTE',
    },
    map_embed_mode: 'placeholder',
  },

  faq_preview: {
    section_label: 'FAQ',
    heading: 'What first-time clients usually ask',
    intro_text: 'A few practical answers to help you feel ready before your first visit.',
    cta_label: 'View FAQ',
    cta_href: '/faq',
    items: [
      {
        question: 'What should I bring?',
        answer: 'TODO_FAQ_1_ANSWER',
      },
      {
        question: 'How early should I arrive?',
        answer: 'TODO_FAQ_2_ANSWER',
      },
      {
        question: 'How do cancellations work?',
        answer: 'TODO_FAQ_3_ANSWER',
      },
    ],
  },

  footer_content: {
    brand_line: 'TODO_BUSINESS_SHORT_DESCRIPTION',
    navigation_groups: [
      {
        title: 'Pages',
        links: [
          { label: 'Home', href: '/' },
          { label: 'Classes', href: '/classes' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Instructors', href: '/instructors' },
          { label: 'Contact', href: '/contact' },
          { label: 'FAQ', href: '/faq' },
        ],
      },
      {
        title: 'Contact',
        links: [
          { label: 'Phone', href: 'tel:TODO_BUSINESS_PHONE' },
          { label: 'Email', href: 'mailto:TODO_BUSINESS_EMAIL' },
          { label: 'Book Now', href: '/book' },
        ],
      },
      {
        // TODO: Remove or replace with real staff navigation once staff portal is built
        title: 'Staff (Dev)',
        links: [
          { label: 'Invite team member', href: '/staff/invite' },
        ],
      },
    ],
    social_links: [
      { label: 'Instagram', href: 'TODO_BUSINESS_INSTAGRAM_URL' },
      { label: 'Facebook', href: 'TODO_BUSINESS_FACEBOOK_URL' },
      { label: 'TikTok', href: 'TODO_BUSINESS_TIKTOK_URL' },
    ],
    legal_links: [{ label: 'Rules', href: '/faq' }],
  },

  seo: {
    site_title: 'TODO_SEO_SITE_TITLE',
    site_description: 'TODO_SEO_SITE_DESCRIPTION',
    og_image: 'TODO_SEO_OG_IMAGE',
    canonical_url: 'TODO_SEO_CANONICAL_URL',
  },
} as const;

export type SiteContent = typeof site_content;
