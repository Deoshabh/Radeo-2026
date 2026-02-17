const SITE_SETTINGS_DEFAULTS = {
  heroSection: {
    enabled: true,
    title: 'Step Into',
    subtitle: 'Timeless Elegance',
    description:
      'Discover exquisite handcrafted shoes made with premium materials and timeless craftsmanship. Each pair is a masterpiece designed to elevate your style.',
    primaryButtonText: 'Explore Collection',
    primaryButtonLink: '/products',
    secondaryButtonText: 'Our Story',
    secondaryButtonLink: '/about',
    backgroundGradient: 'from-primary-50 via-brand-cream/20 to-primary-100',
  },
  trustBadges: [
    {
      id: 'badge-quality',
      icon: 'FiAward',
      title: 'Handcrafted Quality',
      description:
        'Each pair is meticulously crafted by skilled artisans using traditional techniques.',
      enabled: true,
      order: 1,
    },
    {
      id: 'badge-shipping',
      icon: 'FiTruck',
      title: 'Free Delivery',
      description: 'Complimentary shipping on all orders within India.',
      enabled: true,
      order: 2,
    },
    {
      id: 'badge-materials',
      icon: 'FiShield',
      title: 'Premium Materials',
      description:
        'Only the finest leather and materials for lasting comfort and style.',
      enabled: true,
      order: 3,
    },
  ],
  featuredProducts: {
    enabled: true,
    title: 'Featured Collection',
    description:
      'Explore our handpicked selection of premium shoes crafted for the discerning gentleman.',
    productLimit: 8,
    productSelection: 'latest',
    manualProductIds: [],
    viewAllButtonText: 'View All Products',
    viewAllButtonLink: '/products',
  },
  homeSections: {
    madeToOrder: {
      enabled: true,
      title: 'Made to Order',
      description:
        'All our shoes are crafted to order, ensuring perfect fit and uncompromising quality. Each pair takes 7-10 business days to create.',
      features: [
        'Custom Crafted',
        'Premium Leather',
        'Expert Artisans',
        '7-10 Days Delivery',
      ],
    },
    newsletter: {
      enabled: true,
      title: 'Join Our Community',
      description:
        'Be the first to know about new collections, exclusive offers, and styling tips.',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe',
    },
  },
  bannerSystem: {
    enabled: true,
    banners: [
      {
        id: 'banner-home-default',
        type: 'homepage',
        enabled: false,
        title: 'Season Launch',
        description: 'Fresh arrivals are now live.',
        image: '',
        mobileImage: '',
        buttonText: 'Shop Now',
        buttonLink: '/products',
        order: 1,
        startDate: '',
        endDate: '',
      },
    ],
  },
  announcementBar: {
    enabled: false,
    text: 'Grand Opening Sale - Get 20% off on all products with code GRAND20',
    backgroundColor: '#10b981',
    textColor: '#ffffff',
    link: '/products',
    dismissible: true,
  },
  contactInfo: {
    address: '123 Shoe Street, Fashion District, Mumbai 400001',
    phone: '+91 123 456 7890',
    email: 'support@radeo.in',
    showAddress: true,
    showPhone: true,
    showEmail: true,
  },
  socialLinks: [
    { platform: 'facebook', url: '', enabled: false, order: 1 },
    { platform: 'twitter', url: '', enabled: false, order: 2 },
    { platform: 'instagram', url: '', enabled: true, order: 3 },
  ],
  contactPage: {
    title: 'Get in Touch',
    subtitle: "Have a question or need help? We're here for you!",
    formEnabled: true,
    businessHours: [
      { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM' },
      { day: 'Saturday', hours: '10:00 AM - 4:00 PM' },
      { day: 'Sunday', hours: 'Closed' },
    ],
    supportCard: {
      title: 'Quick Answers',
      description:
        'Looking for immediate help? Check out our FAQ section for answers to common questions.',
      ctaText: 'Visit FAQ',
      ctaLink: '/faq',
    },
  },
  faqPage: {
    title: 'Frequently Asked Questions',
    subtitle: 'Find answers to common questions about Radeo',
    categories: [
      {
        id: 'faq-orders',
        name: 'Orders & Payments',
        order: 1,
        enabled: true,
        questions: [
          {
            id: 'faq-orders-1',
            question: 'What payment methods do you accept?',
            answer:
              'We accept major credit/debit cards, UPI, net banking, and Cash on Delivery where available.',
            order: 1,
            enabled: true,
          },
          {
            id: 'faq-orders-2',
            question: 'Can I modify or cancel my order?',
            answer:
              'You can modify or cancel shortly after placing your order from the My Orders page.',
            order: 2,
            enabled: true,
          },
        ],
      },
      {
        id: 'faq-shipping',
        name: 'Shipping & Delivery',
        order: 2,
        enabled: true,
        questions: [
          {
            id: 'faq-shipping-1',
            question: 'How long does delivery take?',
            answer:
              'Most deliveries complete in 3-7 business days, depending on location and product type.',
            order: 1,
            enabled: true,
          },
          {
            id: 'faq-shipping-2',
            question: 'Do you offer free shipping?',
            answer:
              'Yes, free shipping applies above the configured minimum order threshold.',
            order: 2,
            enabled: true,
          },
        ],
      },
    ],
    supportTitle: 'Still have questions?',
    supportDescription: 'Our customer support team is here to help you.',
    supportPrimaryText: 'Contact Support',
    supportPrimaryLink: '/contact',
    supportSecondaryText: 'Email Us',
    supportSecondaryLink: 'mailto:support@radeo.in',
  },
  footerContent: {
    brand: {
      name: 'Radeo',
      description:
        'Premium handcrafted shoes made with timeless craftsmanship and finest materials.',
      logo: '',
    },
    columns: [
      {
        id: 'footer-quick-links',
        title: 'Quick Links',
        order: 1,
        links: [
          { text: 'Home', url: '/', enabled: true, order: 1 },
          { text: 'Products', url: '/products', enabled: true, order: 2 },
          { text: 'About Us', url: '/about', enabled: true, order: 3 },
          { text: 'Contact', url: '/contact', enabled: true, order: 4 },
        ],
      },
      {
        id: 'footer-customer-service',
        title: 'Customer Service',
        order: 2,
        links: [
          { text: 'Track Order', url: '/orders', enabled: true, order: 1 },
          { text: 'Returns & Exchange', url: '/returns', enabled: true, order: 2 },
          { text: 'Shipping Info', url: '/shipping', enabled: true, order: 3 },
          { text: 'FAQ', url: '/faq', enabled: true, order: 4 },
        ],
      },
    ],
    legal: {
      copyrightText: 'All rights reserved.',
      links: [
        { text: 'Privacy Policy', url: '/privacy', enabled: true, order: 1 },
        { text: 'Terms & Conditions', url: '/terms', enabled: true, order: 2 },
      ],
    },
    newsletter: {
      enabled: true,
      title: 'Subscribe to Our Newsletter',
      description: 'Get updates on new products and exclusive offers',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe',
    },
  },
  aboutPage: {
    title: 'About Radeo',
    subtitle: 'Your trusted destination for premium footwear since 2026',
    storyTitle: 'Our Story',
    storyParagraphs: [
      'Radeo was born from a simple belief: everyone deserves access to quality footwear that combines style, comfort, and durability.',
      'We curate products that match modern lifestyles while maintaining quality and comfort standards.',
      'We partner with trusted manufacturers and brands to bring authentic products at fair prices.',
    ],
    values: [
      {
        id: 'about-value-quality',
        icon: 'check',
        title: 'Quality First',
        description:
          'We never compromise on quality. Every product is inspected before reaching you.',
        enabled: true,
        order: 1,
      },
      {
        id: 'about-value-customer',
        icon: 'clock',
        title: 'Customer First',
        description:
          "Your satisfaction is our priority from browsing to post-purchase support.",
        enabled: true,
        order: 2,
      },
      {
        id: 'about-value-delivery',
        icon: 'lightning',
        title: 'Fast Delivery',
        description: 'We process quickly and deliver reliably across serviceable locations.',
        enabled: true,
        order: 3,
      },
    ],
    differentiatorsTitle: 'What Sets Us Apart',
    differentiators: [
      {
        id: 'about-diff-authentic',
        title: 'Authentic Products',
        description: '100% genuine products from trusted brands and manufacturers.',
        enabled: true,
        order: 1,
      },
      {
        id: 'about-diff-returns',
        title: 'Easy Returns',
        description: 'Hassle-free returns within the eligible return window.',
        enabled: true,
        order: 2,
      },
      {
        id: 'about-diff-payments',
        title: 'Secure Payments',
        description: 'Multiple payment options with robust encryption standards.',
        enabled: true,
        order: 3,
      },
      {
        id: 'about-diff-support',
        title: '24/7 Support',
        description: 'Our support team is available whenever you need assistance.',
        enabled: true,
        order: 4,
      },
    ],
    cta: {
      title: 'Ready to Find Your Perfect Pair?',
      description: 'Explore our collection and step into comfort.',
      primaryButtonText: 'Shop Now',
      primaryButtonLink: '/products',
      secondaryButtonText: 'Contact Us',
      secondaryButtonLink: '/contact',
    },
  },
  shippingPolicy: {
    title: 'Shipping Information',
    subtitle: 'Fast, reliable delivery to your doorstep',
    highlights: [
      {
        id: 'shipping-highlight-fast',
        icon: 'lightning',
        title: 'Fast Delivery',
        description: '3-7 business days across India',
      },
      {
        id: 'shipping-highlight-free',
        icon: 'check',
        title: 'Free Shipping',
        description: 'On orders above Rs 1,000',
      },
      {
        id: 'shipping-highlight-track',
        icon: 'chat',
        title: 'Track Order',
        description: 'Real-time tracking updates',
      },
    ],
    shippingCosts: [
      {
        id: 'shipping-cost-free',
        orderValue: 'Above Rs 1,000',
        cost: 'FREE',
        deliveryTime: '3-5 business days',
        badgeText: 'FREE',
      },
      {
        id: 'shipping-cost-standard',
        orderValue: 'Below Rs 1,000',
        cost: 'Rs 50',
        deliveryTime: '3-5 business days',
      },
      {
        id: 'shipping-cost-express',
        orderValue: 'Express Delivery',
        cost: 'Rs 150',
        deliveryTime: '1-2 business days',
        note: 'Available in select metro cities',
      },
    ],
    deliveryZones: [
      {
        id: 'shipping-zone-metro',
        zone: 'Metro Cities',
        cities: 'Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad',
        time: '2-3 business days',
      },
      {
        id: 'shipping-zone-tier2',
        zone: 'Tier 2 Cities',
        cities: 'Pune, Jaipur, Ahmedabad, Lucknow and more',
        time: '3-5 business days',
      },
      {
        id: 'shipping-zone-others',
        zone: 'Other Locations',
        cities: 'Small towns and rural areas',
        time: '5-7 business days',
      },
    ],
    processing: {
      summary:
        'All orders are processed within 24-48 hours (excluding weekends and holidays).',
      points: [
        'In-stock items: 24-48 hours',
        'Made-to-order: 5-7 business days plus delivery',
        'Customized products: 7-10 business days plus delivery',
      ],
    },
    trackingSteps: [
      'Log in to your account',
      'Go to My Orders',
      'Open the order details',
      'View live tracking and ETA',
    ],
    shippingPartners: ['Blue Dart', 'Delhivery', 'FedEx', 'DTDC'],
    deliveryIssues: {
      notHome:
        'Delivery partners attempt 2-3 times before holding at the nearest courier office.',
      delayed:
        'If delivery is delayed, contact support with your order number for immediate help.',
    },
    international: {
      enabled: false,
      message: 'Currently we only ship within India.',
      waitlistText: 'Contact us to join the international shipping waitlist.',
    },
    support: {
      title: 'Questions About Shipping?',
      description: 'Our support team is here to help with shipping-related queries.',
      primaryText: 'Contact Support',
      primaryLink: '/contact',
      secondaryText: 'View FAQ',
      secondaryLink: '/faq',
    },
  },
  returnsPolicy: {
    title: 'Return & Refund Policy',
    subtitle: 'We want you to love your purchase. If not, we make returns easy.',
    quickSummary: [
      {
        id: 'returns-summary-window',
        title: '7-Day Return Window',
        description: 'Return products within 7 days of delivery.',
      },
      {
        id: 'returns-summary-pickup',
        title: 'Free Pickup',
        description: 'We collect return shipments from your doorstep.',
      },
      {
        id: 'returns-summary-refund',
        title: 'Full Refund',
        description: 'Refunds are processed within 5-7 business days after inspection.',
      },
    ],
    eligibilityCriteria: [
      'Returned within 7 days of delivery',
      'Unused and in original condition',
      'Original packaging, tags, and labels intact',
      'No visible signs of wear or damage',
      'Original invoice included',
    ],
    nonReturnableItems: [
      'Products marked as Final Sale or Non-Returnable',
      'Worn, damaged, or altered products',
      'Products without original packaging or tags',
      'Products returned after the return window',
    ],
    returnProcess: [
      {
        id: 'return-step-1',
        step: 1,
        title: 'Initiate Return',
        description: 'Go to your orders and select Return.',
      },
      {
        id: 'return-step-2',
        step: 2,
        title: 'Select Reason',
        description: 'Share reason and details for the return.',
      },
      {
        id: 'return-step-3',
        step: 3,
        title: 'Schedule Pickup',
        description: 'Choose a convenient pickup window.',
      },
      {
        id: 'return-step-4',
        step: 4,
        title: 'Get Refund',
        description: 'Receive refund once quality checks are complete.',
      },
    ],
    refundPolicy: {
      processingTime: '5-7 business days after successful inspection.',
      methods: [
        'Online payments: refunded to original payment method',
        'Cash on Delivery: bank transfer after details confirmation',
        'Store credit: optional instant credit where applicable',
      ],
      note: 'Bank processing may add 2-3 business days.',
    },
    exchangePolicy: [
      'Return the original product first',
      'Place a new order for required item/size',
      'Contact support if you need expedited replacement help',
    ],
    damagedProductPolicy: {
      intro: 'If you receive a damaged or defective product:',
      steps: [
        'Take clear photos of product and packaging',
        'Contact support within 24 hours of delivery',
        'Share photos over support email',
        'Pickup and refund/replacement will be prioritized',
      ],
      note:
        'For damaged products, normal return window constraints may be relaxed after verification.',
    },
    support: {
      title: 'Need Help with a Return?',
      description:
        'Our customer service team is here to assist with returns or refunds.',
      primaryText: 'Contact Support',
      primaryLink: '/contact',
      secondaryText: 'Email Us',
      secondaryLink: 'mailto:support@radeo.in',
    },
  },
  maintenanceMode: {
    enabled: false,
    title: 'We will be back soon',
    message:
      'We are performing scheduled maintenance. Thank you for your patience.',
    estimatedEndTime: '',
    allowAdminAccess: true,
    allowedIPs: [],
  },
  theme: {
    primaryColor: '#3B2F2F',
    secondaryColor: '#E5D3B3',
    backgroundColor: '#fafaf9',
    textColor: '#1c1917',
    fontFamily: 'Inter',
    borderRadius: '8px',
    stickyHeader: true,
    headerVariant: 'solid',
  },
};

const SETTING_CATEGORY_MAP = {
  heroSection: 'home',
  trustBadges: 'home',
  featuredProducts: 'home',
  homeSections: 'home',
  bannerSystem: 'marketing',
  announcementBar: 'marketing',
  contactInfo: 'contact',
  socialLinks: 'contact',
  contactPage: 'contact',
  faqPage: 'faq',
  footerContent: 'footer',
  aboutPage: 'about',
  shippingPolicy: 'policies',
  returnsPolicy: 'policies',
  maintenanceMode: 'system',
  theme: 'appearance',
};

const PUBLIC_SETTING_KEYS = [
  'heroSection',
  'trustBadges',
  'featuredProducts',
  'homeSections',
  'bannerSystem',
  'announcementBar',
  'contactInfo',
  'socialLinks',
  'contactPage',
  'faqPage',
  'footerContent',
  'aboutPage',
  'shippingPolicy',
  'returnsPolicy',
  'maintenanceMode',
  'theme',
];

const isKnownSettingKey = (key) => Boolean(SITE_SETTINGS_DEFAULTS[key]);

const deepClone = (value) => {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value));
};

const getDefaultSettingValue = (key) => {
  if (!isKnownSettingKey(key)) return null;
  return deepClone(SITE_SETTINGS_DEFAULTS[key]);
};

const getPublicSettingValue = (key, value) => {
  if (!isKnownSettingKey(key)) return null;

  if (key === 'maintenanceMode') {
    const maintenance = value || {};
    return {
      enabled: Boolean(maintenance.enabled),
      title: maintenance.title || '',
      message: maintenance.message || '',
      estimatedEndTime: maintenance.estimatedEndTime || '',
      allowAdminAccess: Boolean(maintenance.allowAdminAccess),
    };
  }

  return deepClone(value);
};

module.exports = {
  SITE_SETTINGS_DEFAULTS,
  SETTING_CATEGORY_MAP,
  PUBLIC_SETTING_KEYS,
  isKnownSettingKey,
  getDefaultSettingValue,
  getPublicSettingValue,
};
