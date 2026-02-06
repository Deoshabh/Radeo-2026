import Link from 'next/link';

export const metadata = {
  title: 'About Us - Radeo',
  description: 'Learn about Radeo - your destination for premium footwear. Discover our story, mission, and commitment to quality.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            About Radeo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your trusted destination for premium footwear since 2026
          </p>
        </div>

        {/* Our Story */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-primary-900 mb-6">
              Our Story
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                Radeo was born from a simple belief: everyone deserves access to quality footwear that combines style, comfort, and durability. What started as a vision to revolutionize the online shoe shopping experience has grown into a trusted destination for shoe enthusiasts across India.
              </p>
              <p>
                We understand that shoes are more than just accessories - they&apos;re an extension of your personality, a tool for your adventures, and a companion in your daily journey. That&apos;s why we&apos;ve dedicated ourselves to curating a collection that meets the diverse needs of modern lifestyles.
              </p>
              <p>
                Every pair of shoes in our collection is carefully selected to ensure it meets our high standards for quality, comfort, and style. We work directly with trusted manufacturers and brands to bring you authentic products at competitive prices.
              </p>
            </div>
          </div>
        </div>

        {/* Mission & Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary-900 mb-3">
              Quality First
            </h3>
            <p className="text-gray-600">
              We never compromise on quality. Every product is inspected to ensure it meets our rigorous standards before reaching you.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary-900 mb-3">
              Customer First
            </h3>
            <p className="text-gray-600">
              Your satisfaction is our priority. We&apos;re here to support you every step of the way, from browsing to delivery and beyond.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary-900 mb-3">
              Fast Delivery
            </h3>
            <p className="text-gray-600">
              We know you&apos;re excited to wear your new shoes. That&apos;s why we ensure quick processing and reliable delivery to your doorstep.
            </p>
          </div>
        </div>

        {/* What Sets Us Apart */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-xl p-8 md:p-12 text-white mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            What Sets Us Apart
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Authentic Products</h4>
                <p className="text-primary-100">100% genuine products directly from trusted brands and manufacturers</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Easy Returns</h4>
                <p className="text-primary-100">Hassle-free returns within 7 days if you&apos;re not completely satisfied</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Secure Payments</h4>
                <p className="text-primary-100">Multiple payment options with industry-standard encryption</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">24/7 Support</h4>
                <p className="text-primary-100">Our customer service team is always ready to help you</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary-900 mb-4">
            Ready to Find Your Perfect Pair?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Explore our collection and step into comfort
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="btn btn-primary text-lg px-8 py-4"
            >
              Shop Now
            </Link>
            <Link
              href="/contact"
              className="btn btn-secondary text-lg px-8 py-4"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
