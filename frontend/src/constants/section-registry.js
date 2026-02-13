
import { FiLayout, FiShoppingBag, FiType, FiMail, FiImage } from 'react-icons/fi';

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
      imageUrl: '/hero-placeholder.jpg',
      alignment: 'center', // left, center, right
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { name: 'buttonText', label: 'Button Text', type: 'text' },
      { name: 'buttonLink', label: 'Button Link', type: 'text' },
      { name: 'imageUrl', label: 'Background Image', type: 'image' },
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
      title: 'Best Sellers',
      category: '', // empty = all
      count: 4,
    },
    fields: [
      { name: 'title', label: 'Section Title', type: 'text' },
      { name: 'category', label: 'Category Slug', type: 'text', help: 'Leave empty for all products' },
      { name: 'count', label: 'Number of Products', type: 'number' },
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
    ]
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    icon: <FiMail />,
    defaultData: {
      title: 'Subscribe to our newsletter',
      placeholder: 'Enter your email',
    },
    fields: [
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'placeholder', label: 'Input Placeholder', type: 'text' },
    ]
  }
];

export const getTemplateByType = (type) => SECTION_TEMPLATES.find(t => t.type === type);
