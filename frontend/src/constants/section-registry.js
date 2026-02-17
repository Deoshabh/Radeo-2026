
import { FiLayout, FiShoppingBag, FiType, FiMail, FiBox } from 'react-icons/fi';

export const SECTION_TEMPLATES = [
  {
    type: 'hero',
    label: 'Hero Banner',
    icon: <FiLayout />,
    defaultData: {
      title: 'New Collections 2026',
      subtitle: 'Experience comfort and style like never before.',
      buttonText: 'Shop Now',
      buttonLink: '/products',
      secondaryButtonText: 'Our Story',
      secondaryButtonLink: '/about',
      imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1600&h=900&fit=crop&q=80',
      alignment: 'center', // left, center, right
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { name: 'buttonText', label: 'Button Text', type: 'text' },
      { name: 'buttonLink', label: 'Button Link', type: 'text' },
      { name: 'secondaryButtonText', label: 'Secondary Button Text', type: 'text' },
      { name: 'secondaryButtonLink', label: 'Secondary Button Link', type: 'text' },
      { name: 'imageUrl', label: 'Background Image', type: 'image' },
      {
        name: 'customCss',
        label: 'Section Custom CSS',
        type: 'code',
        help: 'Use {{scope}} to target this section only. Example: {{scope}} h1 { color: red; }',
      },
      {
        name: 'visibilityRules',
        label: 'Visibility Rules (JSON)',
        type: 'json',
        defaultValue: {},
        help: 'Example: {"devices":["desktop"],"startAt":"2026-02-20T00:00:00Z"}',
      },
      {
        name: 'experiments',
        label: 'A/B Experiment (JSON)',
        type: 'json',
        defaultValue: { enabled: false, variants: [] },
        help: 'Example: {"enabled":true,"variants":[{"id":"A","weight":50,"data":{"title":"Variant A"}}]}',
      },
      {
        name: 'blocks',
        label: 'Dynamic Blocks (JSON)',
        type: 'json',
        defaultValue: [],
        help: 'Example: [{"id":"b1","zone":"after","type":"heading","props":{"text":"Promo"}}]',
      },
      {
        name: 'globalClassStyles',
        label: 'Global Class Styles (JSON)',
        type: 'json',
        defaultValue: {},
        help: 'Example: {"heroTitle":"font-size:48px; color:#111;"}',
      },
      { 
        name: 'alignment', 
        label: 'Text Alignment', 
        type: 'select', 
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' }
        ] 
      },
    ]
  },
  {
    type: 'products',
    label: 'Featured Products',
    icon: <FiShoppingBag />,
    defaultData: {
      title: 'Featured Collection',
      description: 'Explore our handpicked selection of premium shoes.',
      productLimit: 8,
      viewAllButtonText: 'View All Products',
      viewAllButtonLink: '/products',
    },
    fields: [
      { name: 'title', label: 'Section Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'productLimit', label: 'Number of Products', type: 'number' },
      { name: 'viewAllButtonText', label: 'View All Button Text', type: 'text' },
      { name: 'viewAllButtonLink', label: 'View All Button Link', type: 'text' },
      { name: 'customCss', label: 'Section Custom CSS', type: 'code' },
      { name: 'visibilityRules', label: 'Visibility Rules (JSON)', type: 'json', defaultValue: {} },
      { name: 'experiments', label: 'A/B Experiment (JSON)', type: 'json', defaultValue: { enabled: false, variants: [] } },
      { name: 'blocks', label: 'Dynamic Blocks (JSON)', type: 'json', defaultValue: [] },
      { name: 'globalClassStyles', label: 'Global Class Styles (JSON)', type: 'json', defaultValue: {} },
    ]
  },
  {
    type: 'madeToOrder',
    label: 'Made To Order',
    icon: <FiBox />,
    defaultData: {
      title: 'Made to Order',
      description: 'All our shoes are crafted to order for perfect fit and quality.',
      features: ['Custom Crafted', 'Premium Leather', 'Expert Artisans', '7-10 Days Delivery'],
    },
    fields: [
      { name: 'title', label: 'Section Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      {
        name: 'features',
        label: 'Features (one per line)',
        type: 'textarea',
        help: 'Enter one feature per line',
      },
      { name: 'customCss', label: 'Section Custom CSS', type: 'code' },
      { name: 'visibilityRules', label: 'Visibility Rules (JSON)', type: 'json', defaultValue: {} },
      { name: 'experiments', label: 'A/B Experiment (JSON)', type: 'json', defaultValue: { enabled: false, variants: [] } },
      { name: 'blocks', label: 'Dynamic Blocks (JSON)', type: 'json', defaultValue: [] },
      { name: 'globalClassStyles', label: 'Global Class Styles (JSON)', type: 'json', defaultValue: {} },
    ]
  },
  {
    type: 'text',
    label: 'Rich Text',
    icon: <FiType />,
    defaultData: {
      content: '## Our Story\nWe started with a simple idea...',
    },
    fields: [
      { name: 'content', label: 'Content (Markdown)', type: 'textarea' },
      { name: 'customCss', label: 'Section Custom CSS', type: 'code' },
      { name: 'visibilityRules', label: 'Visibility Rules (JSON)', type: 'json', defaultValue: {} },
      { name: 'experiments', label: 'A/B Experiment (JSON)', type: 'json', defaultValue: { enabled: false, variants: [] } },
      { name: 'blocks', label: 'Dynamic Blocks (JSON)', type: 'json', defaultValue: [] },
      { name: 'globalClassStyles', label: 'Global Class Styles (JSON)', type: 'json', defaultValue: {} },
    ]
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    icon: <FiMail />,
    defaultData: {
      title: 'Subscribe to our newsletter',
      description: 'Get updates on new products and exclusive offers',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe',
    },
    fields: [
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'placeholder', label: 'Input Placeholder', type: 'text' },
      { name: 'buttonText', label: 'Button Text', type: 'text' },
      { name: 'customCss', label: 'Section Custom CSS', type: 'code' },
      { name: 'visibilityRules', label: 'Visibility Rules (JSON)', type: 'json', defaultValue: {} },
      { name: 'experiments', label: 'A/B Experiment (JSON)', type: 'json', defaultValue: { enabled: false, variants: [] } },
      { name: 'blocks', label: 'Dynamic Blocks (JSON)', type: 'json', defaultValue: [] },
      { name: 'globalClassStyles', label: 'Global Class Styles (JSON)', type: 'json', defaultValue: {} },
    ]
  }
];

export const getTemplateByType = (type) => SECTION_TEMPLATES.find(t => t.type === type);
