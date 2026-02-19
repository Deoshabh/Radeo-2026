/**
 * CMS Pages Seed Script
 * -----------------------
 * Pre-populates the CMS with default website pages so admins
 * can manage content for About, Contact, FAQ, Shipping,
 * Returns, Privacy, and Terms pages from the admin panel.
 *
 * Usage:  node seed/cms-pages.seed.js
 * Env:    MONGODB_URI (or defaults to localhost)
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ContentPage = require('../models/ContentPage');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/radeo';

const DEFAULT_PAGES = [
  {
    title: 'About Us',
    slug: 'about',
    path: '/about',
    category: 'page',
    template: 'default',
    status: 'published',
    metaTitle: 'About Us — RADEO',
    metaDescription: 'Learn about RADEO, our story, mission, and commitment to premium footwear.',
    blocks: [
      { type: 'hero', position: 0, config: { title: 'About RADEO', subtitle: 'Crafting premium footwear since 2024', backgroundType: 'color' }, visibility: 'all' },
      { type: 'text', position: 1, config: { content: 'At RADEO, we believe in the perfect blend of tradition and innovation. Our shoes are crafted using the finest materials and time-honored techniques, ensuring every pair delivers comfort, durability, and style.\n\nOur journey began with a simple vision: to create footwear that empowers people to walk with confidence. From our workshop to your wardrobe, each shoe carries our promise of quality.' }, visibility: 'all' },
      { type: 'features', position: 2, config: { title: 'Why Choose RADEO', items: [{ title: 'Premium Materials', description: 'We source the finest leather and fabrics from trusted suppliers.' }, { title: 'Expert Craftsmanship', description: 'Every pair is crafted with attention to detail by skilled artisans.' }, { title: 'Comfort First', description: 'Ergonomic design ensures all-day comfort without compromising style.' }] }, visibility: 'all' },
    ],
  },
  {
    title: 'Contact Us',
    slug: 'contact',
    path: '/contact',
    category: 'page',
    template: 'default',
    status: 'published',
    metaTitle: 'Contact Us — RADEO',
    metaDescription: 'Get in touch with RADEO. We are here to help with orders, returns, and any questions.',
    blocks: [
      { type: 'hero', position: 0, config: { title: 'Get in Touch', subtitle: 'We\'d love to hear from you' }, visibility: 'all' },
      { type: 'text', position: 1, config: { content: 'Have a question about an order, need help choosing the right size, or just want to say hello? Our team is here to help. Reach out and we\'ll get back to you as soon as possible.' }, visibility: 'all' },
    ],
  },
  {
    title: 'Frequently Asked Questions',
    slug: 'faq',
    path: '/faq',
    category: 'faq',
    template: 'default',
    status: 'published',
    metaTitle: 'FAQ — RADEO',
    metaDescription: 'Find answers to common questions about RADEO orders, shipping, returns, sizing, and more.',
    blocks: [
      { type: 'hero', position: 0, config: { title: 'Frequently Asked Questions', subtitle: 'Quick answers to common questions' }, visibility: 'all' },
      { type: 'accordion', position: 1, config: { items: [
        { title: 'How do I track my order?', content: 'Once your order ships, you\'ll receive an email with tracking information. You can also check order status in your account under "My Orders".' },
        { title: 'What is your return policy?', content: 'We accept returns within 7 days of delivery for unworn items in original packaging. Visit our Returns page for detailed instructions.' },
        { title: 'How do I find my shoe size?', content: 'Use our size guide on each product page. Measure your foot length in cm and match it to our size chart. When in doubt, size up.' },
        { title: 'Do you offer international shipping?', content: 'Currently we ship within India. International shipping is coming soon.' },
        { title: 'How can I contact customer support?', content: 'Email us at support@radeo.in or use the Contact page. We respond within 24 hours on business days.' },
      ]}, visibility: 'all' },
    ],
  },
  {
    title: 'Shipping Policy',
    slug: 'shipping',
    path: '/shipping',
    category: 'policy',
    template: 'default',
    status: 'published',
    metaTitle: 'Shipping Policy — RADEO',
    metaDescription: 'Learn about RADEO shipping options, delivery times, and costs across India.',
    blocks: [
      { type: 'hero', position: 0, config: { title: 'Shipping Policy', subtitle: 'Fast & reliable delivery across India' }, visibility: 'all' },
      { type: 'text', position: 1, config: { content: '## Delivery Times\n\n- **Metro cities**: 3-5 business days\n- **Other cities**: 5-7 business days\n- **Remote areas**: 7-10 business days\n\n## Shipping Costs\n\n- **Free shipping** on orders above ₹999\n- Flat ₹99 shipping fee on orders below ₹999\n\n## Order Tracking\n\nAll orders include tracking. You\'ll receive SMS and email updates at each stage of delivery.' }, visibility: 'all' },
    ],
  },
  {
    title: 'Return & Exchange Policy',
    slug: 'returns',
    path: '/returns',
    category: 'policy',
    template: 'default',
    status: 'published',
    metaTitle: 'Returns & Exchanges — RADEO',
    metaDescription: 'RADEO return and exchange policy. Easy 7-day returns on unworn items.',
    blocks: [
      { type: 'hero', position: 0, config: { title: 'Returns & Exchanges', subtitle: 'Hassle-free returns within 7 days' }, visibility: 'all' },
      { type: 'text', position: 1, config: { content: '## Return Eligibility\n\n- Items must be unworn and in original packaging\n- Return request within 7 days of delivery\n- Sale items and customized products are final sale\n\n## How to Return\n\n1. Go to "My Orders" in your account\n2. Select the order and click "Return"\n3. Choose your reason and schedule a pickup\n4. Pack the item in its original box\n\n## Refund Timeline\n\n- Refund initiated within 2 business days of receiving returned item\n- Bank/UPI refunds: 5-7 business days\n- Store credit: Instant' }, visibility: 'all' },
    ],
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy',
    path: '/privacy',
    category: 'policy',
    template: 'default',
    status: 'published',
    metaTitle: 'Privacy Policy — RADEO',
    metaDescription: 'How RADEO collects, uses, and protects your personal information.',
    blocks: [
      { type: 'hero', position: 0, config: { title: 'Privacy Policy', subtitle: 'Your privacy matters to us' }, visibility: 'all' },
      { type: 'text', position: 1, config: { content: 'This Privacy Policy describes how RADEO collects, uses, and protects your personal data when you use our website and services.\n\n## Information We Collect\n\n- **Account information**: Name, email, phone number\n- **Order information**: Shipping address, payment method (processed securely via payment gateway)\n- **Usage data**: Pages visited, products viewed (for improving your experience)\n\n## How We Use Your Data\n\n- Process and deliver orders\n- Send order updates and tracking info\n- Improve our products and services\n- Send promotional offers (only with your consent)\n\n## Data Protection\n\nWe use industry-standard encryption and security measures to protect your personal information. We never sell your data to third parties.' }, visibility: 'all' },
    ],
  },
  {
    title: 'Terms & Conditions',
    slug: 'terms',
    path: '/terms',
    category: 'policy',
    template: 'default',
    status: 'published',
    metaTitle: 'Terms & Conditions — RADEO',
    metaDescription: 'Terms and conditions for using the RADEO website and purchasing our products.',
    blocks: [
      { type: 'hero', position: 0, config: { title: 'Terms & Conditions', subtitle: 'Please read carefully before using our services' }, visibility: 'all' },
      { type: 'text', position: 1, config: { content: 'By accessing and using this website, you agree to be bound by these Terms & Conditions.\n\n## Orders & Pricing\n\n- All prices are in Indian Rupees (INR) and include applicable taxes\n- We reserve the right to modify prices without prior notice\n- Orders are confirmed only after successful payment\n\n## Intellectual Property\n\nAll content, designs, logos, and images on this website are the property of RADEO and are protected by copyright.\n\n## Limitation of Liability\n\nRADEO shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.\n\n## Governing Law\n\nThese terms are governed by the laws of India. Any disputes shall be resolved in the courts of [Your City], India.' }, visibility: 'all' },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an admin user to set as createdBy
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    let created = 0;
    let skipped = 0;

    for (const pageData of DEFAULT_PAGES) {
      const exists = await ContentPage.findOne({ slug: pageData.slug });
      if (exists) {
        console.log(`  ⏩ Skipping "${pageData.title}" — already exists`);
        skipped++;
        continue;
      }

      await ContentPage.create({
        ...pageData,
        createdBy: admin._id,
        updatedBy: admin._id,
        publishAt: new Date(),
        version: 1,
      });
      console.log(`  ✅ Created "${pageData.title}" (${pageData.path})`);
      created++;
    }

    console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
