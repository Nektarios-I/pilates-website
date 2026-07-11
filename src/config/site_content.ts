import { site_images } from '@/config/site_images';

export const site_content = {
  studio_info: {
    studio_name: 'corehouse Pilates Studio',
    tagline: 'Reformer and mat Pilates',
    short_description: 'A calm studio for reformer and mat Pilates.',
    long_description:
      'corehouse is a focused Pilates studio offering reformer and mat classes with attentive instruction and a clear weekly schedule.',
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
    login_href: '/login',
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
    headline: 'Where movement comes home.',
    subheading: 'Sculpt · Strengthen · Align',
    supporting_text: 'Private and small group reformer and mat Pilates sessions.',
    primary_cta_label: 'Book Now',
    primary_cta_href: '/book',
    secondary_cta_label: 'View Classes',
    secondary_cta_href: '/classes',
    image_src: site_images.home.hero.src,
    image_alt: site_images.home.hero.alt,
  },

  studio_overview: {
    section_label: 'Studio',
    heading: 'A clear place to practice',
    intro_text: 'Reformer and mat classes, a steady weekly schedule, and instruction that keeps the work precise.',
    highlights: [
      'Reformer and mat classes',
      'Mon–Sat schedule with morning and afternoon sessions',
      'Small groups and attentive teaching',
    ],
  },

  classes_preview: {
    section_label: 'Classes',
    heading: 'Reformer and mat',
    intro_text: 'Two class types to match your preference and level.',
    cta_label: 'View Classes',
    cta_href: '/classes',
    items: [
      {
        name: 'Reformer',
        description: 'Spring-loaded equipment for full-body strength, control, and alignment.',
        duration: '55 min',
        level: 'All levels',
        capacity: 'Small group',
        image_src: site_images.classes.reformer.src,
        image_alt: site_images.classes.reformer.alt,
      },
      {
        name: 'Mat',
        description: 'Floor-based Pilates focusing on core strength, mobility, and breath.',
        duration: '50 min',
        level: 'All levels',
        capacity: 'Small group',
        image_src: site_images.classes.mat.src,
        image_alt: site_images.classes.mat.alt,
      },
    ],
  },

  pricing_preview: {
    section_label: 'Pricing',
    heading: 'Class packages',
    intro_text: 'Separate packages for reformer and mat Pilates sessions.',
    cta_label: 'View Pricing',
    cta_href: '/pricing',
    reformer: {
      single: {
        name: 'Single class',
        price: '€15',
        description: '1 class',
      },
      one_month: [
        {
          name: '2× per week',
          price: '€100',
          description: '8 classes · 30 days',
        },
        {
          name: '3× per week',
          price: '€145',
          description: '12 classes · 30 days',
        },
        {
          name: '4× per week',
          price: '€185',
          description: '16 classes · 30 days',
        },
      ],
      three_month: [
        {
          name: '2× per week',
          price: '€265',
          description: '24 classes · 90 days',
        },
        {
          name: '3× per week',
          price: '€400',
          description: '36 classes · 90 days',
        },
        {
          name: '4× per week',
          price: '€520',
          description: '48 classes · 90 days',
        },
      ],
    },
    mat: {
      single: {
        name: 'Single class',
        price: '€10',
        description: '1 mat class',
      },
      one_month: [
        {
          name: '2× per week',
          price: '€70',
          description: '8 classes · 30 days',
        },
        {
          name: '3× per week',
          price: '€95',
          description: '12 classes · 30 days',
        },
        {
          name: '4× per week',
          price: '€120',
          description: '16 classes · 30 days',
        },
      ],
      three_month: [
        {
          name: '2× per week',
          price: '€195',
          description: '24 classes · 90 days',
        },
        {
          name: '3× per week',
          price: '€275',
          description: '36 classes · 90 days',
        },
        {
          name: '4× per week',
          price: '€350',
          description: '48 classes · 90 days',
        },
      ],
    },
    plans: [
      { name: 'Single class', price: '€15', description: '1 reformer class' },
      { name: '1 month · 2×/week', price: '€100', description: '8 classes' },
      { name: '3 months · 2×/week', price: '€265', description: '24 classes' },
    ],
    policies_short:
      'Arrive a few minutes early. Cancel more than 4 hours before class to restore your credit. Grip socks required for reformer.',
  },

  instructors_preview: {
    section_label: 'Instructors',
    heading: 'The team',
    intro_text: 'Attentive, experienced teachers in a calm studio setting.',
    cta_label: 'View Instructors',
    cta_href: '/instructors',
    items: [{ name: 'Panayiota' }, { name: 'Irene' }],
  },

  contact_preview: {
    section_label: 'Contact',
    heading: 'Get in touch',
    intro_text: 'Call to book or ask a question.',
    cta_label: 'Contact',
    cta_href: '/contact',
    phone: '+357 99 954286',
    phone_href: '+35799954286',
    email: '',
    address_line_1: '',
    address_line_2: '',
    city: 'Cyprus',
    postcode: '',
    country: 'Cyprus',
    google_maps_url: 'https://maps.app.goo.gl/foVSeBbNCW9pTwVj7',
    hours: {
      weekday: 'Mon–Fri: 6:00–12:00 & 15:00–20:00',
      saturday: 'Sat: 7:00–11:00',
      sunday: 'Closed',
      note: '',
    },
    map_embed_mode: 'placeholder',
  },

  faq_preview: {
    section_label: 'FAQ',
    heading: 'Before your visit',
    intro_text: 'Practical details for booking and attending class.',
    cta_label: 'View FAQ',
    cta_href: '/faq',
    items: [
      {
        question: 'What should I bring?',
        answer: 'Comfortable fitted clothing and grip socks for reformer. A water bottle if you like.',
      },
      {
        question: 'How early should I arrive?',
        answer: 'Arrive 5–10 minutes before class so you can settle in calmly.',
      },
      {
        question: 'How do cancellations work?',
        answer:
          'Cancel online more than 4 hours before class start to restore your session credit. Inside 4 hours, online cancellation is not available and the credit is kept.',
      },
    ],
  },

  footer_content: {
    brand_line: 'Where movement comes home. Reformer and mat Pilates in Cyprus.',
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
          { label: 'Rules', href: '/faq#rules' },
        ],
      },
      {
        title: 'Contact',
        links: [
          { label: '+357 99 954286', href: 'tel:+35799954286' },
          { label: 'Book Now', href: '/book' },
        ],
      },
    ],
    social_links: [
      {
        label: 'Instagram',
        href: 'https://www.instagram.com/corehouse.pilates.s/',
      },
    ] as { label: string; href: string }[],
    legal_links: [] as { label: string; href: string }[],
  },

  seo: {
    site_title: 'corehouse Pilates Studio',
    site_description:
      'Reformer & mat Pilates in Cyprus. Small-group classes with attentive instruction for strength, alignment, and mobility. View pricing and book online.',
    google_business_description:
      'corehouse Pilates Studio offers reformer and mat Pilates in a calm, focused setting. Our small-group classes give you attentive instruction and a clear weekly schedule, whether you are new to Pilates or returning to your practice.\n\nChoose reformer sessions on professional equipment or mat classes for core strength, mobility, and breath-led control. Flexible pricing includes single classes and monthly packages.\n\nView class types, meet our instructors, and book sessions online. Grip socks are required for reformer classes. We look forward to welcoming you to the studio.',
    keywords: [
      'Pilates studio Cyprus',
      'reformer Pilates Cyprus',
      'mat Pilates Cyprus',
      'Pilates classes',
      'book Pilates online',
      'corehouse Pilates',
    ],
    og_image: '/images/seo/corehouse_logo.png',
    canonical_url: '',
  },
} as const;

export type SiteContent = typeof site_content;
