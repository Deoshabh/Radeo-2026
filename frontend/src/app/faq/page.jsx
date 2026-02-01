'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
  {
    category: 'Orders & Payments',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards (Visa, Mastercard, RuPay), UPI, net banking, and Cash on Delivery (COD). All online payments are secured with industry-standard encryption.',
      },
      {
        q: 'Can I modify or cancel my order?',
        a: 'You can modify or cancel your order within 2 hours of placing it. Go to "My Orders" and click "Cancel Order". After 2 hours, orders enter processing and cannot be cancelled. However, you can still return the product after delivery.',
      },
      {
        q: 'How do I track my order?',
        a: 'Once your order is shipped, you\'ll receive a tracking number via email and SMS. You can also track your order from the "My Orders" section in your account.',
      },
      {
        q: 'Do you provide invoices?',
        a: 'Yes, we send a digital invoice to your email after order confirmation. A physical copy is also included with your shipment.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    questions: [
      {
        q: 'How long does delivery take?',
        a: 'Delivery typically takes 3-7 business days depending on your location. Metro cities: 2-3 days, Tier 2 cities: 3-5 days, Other locations: 5-7 days. Express delivery (1-2 days) is available in select cities.',
      },
      {
        q: 'Do you offer free shipping?',
        a: 'Yes! We offer free shipping on all orders above ₹1,000. For orders below ₹1,000, a flat shipping fee of ₹50 applies.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently, we only ship within India. We\'re working on expanding to international markets soon. Contact us to join the international shipping waitlist!',
      },
      {
        q: 'What if I\'m not home during delivery?',
        a: 'Our delivery partner will attempt delivery 2-3 times. If unsuccessful, the package will be held at the nearest courier office for 5 days. You can reschedule delivery by contacting our support team.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We offer a hassle-free 7-day return policy. Products must be unused, in original condition with all tags and packaging intact. We provide free pickup from your doorstep.',
      },
      {
        q: 'How do I return a product?',
        a: 'Go to "My Orders", select the order, and click "Return". Choose your reason, schedule a pickup, and we\'ll collect the product. Refund will be processed within 5-7 business days after we receive the product.',
      },
      {
        q: 'How long does it take to get a refund?',
        a: 'Refunds are processed within 5-7 business days after we receive and inspect the returned product. The amount will be credited to your original payment method (or bank account for COD orders).',
      },
      {
        q: 'Can I exchange a product?',
        a: 'We don\'t offer direct exchanges currently. Please return the original product and place a new order for the desired item. Contact our support team - we may expedite your new order.',
      },
      {
        q: 'What if I receive a damaged product?',
        a: 'If you receive a damaged or defective product, contact us within 24 hours with photos. We\'ll arrange immediate pickup and provide a full refund or replacement.',
      },
    ],
  },
  {
    category: 'Product Information',
    questions: [
      {
        q: 'How do I know which size to order?',
        a: 'Each product page has a detailed size chart. We recommend measuring your foot and comparing it with our size guide. If you\'re between sizes, we suggest ordering the larger size for comfort.',
      },
      {
        q: 'Are the products authentic?',
        a: 'Yes, we guarantee 100% authentic products. We source directly from authorized manufacturers and brands. All products come with quality assurance.',
      },
      {
        q: 'How do I care for my shoes?',
        a: 'Care instructions vary by material. Generally: clean with a soft brush, avoid harsh chemicals, air dry away from direct heat, and store in a cool, dry place. Specific care instructions are included with each product.',
      },
      {
        q: 'Do you offer customization?',
        a: 'Some products are available for customization. Look for the "Customizable" tag on product pages. Customized products take 7-10 business days to make and cannot be returned.',
      },
    ],
  },
  {
    category: 'Account & Security',
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click "Sign In" in the top right corner, then click "Create Account". You can register using your email or phone number. Creating an account allows you to track orders, save addresses, and manage your wishlist.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Absolutely! We use industry-standard SSL encryption for all transactions. We do not store your complete card details. All payments are processed through secure payment gateways (Razorpay).',
      },
      {
        q: 'I forgot my password. What should I do?',
        a: 'Click "Forgot Password" on the login page. Enter your registered email, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.',
      },
      {
        q: 'Can I change my registered email or phone?',
        a: 'Yes, you can update your email or phone number from your account settings. Go to "My Profile" and click "Edit Profile" to make changes.',
      },
    ],
  },
  {
    category: 'Coupons & Offers',
    questions: [
      {
        q: 'How do I use a coupon code?',
        a: 'Enter your coupon code at checkout in the "Apply Coupon" section. The discount will be applied to your order total. Note: Only one coupon can be used per order.',
      },
      {
        q: 'Can I use multiple coupons on one order?',
        a: 'No, only one coupon code can be applied per order. The system will automatically apply the coupon that gives you the best discount.',
      },
      {
        q: 'Why isn\'t my coupon working?',
        a: 'Coupons may not work if: they\'ve expired, minimum order value isn\'t met, they\'re not applicable to products in your cart, or they\'re user-specific. Check the coupon terms and conditions.',
      },
      {
        q: 'How do I get notified about sales and offers?',
        a: 'Subscribe to our newsletter at the bottom of the page. You can also enable push notifications and follow us on social media for exclusive deals and early access to sales.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenQuestion(openQuestion === key ? null : key);
  };

  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          item =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.questions.length > 0)
    : faqs;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to common questions about Radeo
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-full border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none text-lg"
              />
              <svg
                className="absolute right-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        {!searchQuery && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-primary-900 mb-4">
              Popular Topics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {faqs.map((category, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const element = document.getElementById(`category-${index}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-medium transition-colors text-left"
                >
                  {category.category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        <div className="space-y-8">
          {filteredFaqs.map((category, categoryIndex) => (
            <div
              key={categoryIndex}
              id={`category-${categoryIndex}`}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-primary-900 mb-6">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((item, questionIndex) => {
                  const isOpen = openQuestion === `${categoryIndex}-${questionIndex}`;
                  return (
                    <div
                      key={questionIndex}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">
                          {item.q}
                        </span>
                        <svg
                          className={`w-5 h-5 text-primary-600 flex-shrink-0 transform transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {searchQuery && filteredFaqs.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any FAQs matching "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-primary"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">
            Still have questions?
          </h2>
          <p className="text-primary-100 mb-6 text-lg">
            Our customer support team is here to help you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Contact Support
            </Link>
            <a
              href="mailto:support@radeo.in"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition-colors border-2 border-primary-500"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
