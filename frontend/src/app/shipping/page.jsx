import Link from 'next/link';

export const metadata = {
  title: 'Shipping Information - Radeo',
  description: 'Learn about our shipping methods, delivery times, and costs. Fast and reliable delivery across India.',
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            Shipping Information
          </h1>
          <p className="text-xl text-gray-600">
            Fast, reliable delivery to your doorstep
          </p>
        </div>

        {/* Shipping Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-primary-900 mb-2">Fast Delivery</h3>
            <p className="text-gray-600">3-7 business days across India</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-primary-900 mb-2">Free Shipping</h3>
            <p className="text-gray-600">On orders above ₹1,000</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-primary-900 mb-2">Track Order</h3>
            <p className="text-gray-600">Real-time tracking updates</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-10">
          {/* Shipping Costs */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Shipping Costs
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Order Value</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Shipping Cost</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Delivery Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Above ₹1,000</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        FREE
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">3-5 business days</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-gray-700">Below ₹1,000</td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">₹50</td>
                    <td className="px-6 py-4 text-gray-700">3-5 business days</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Express Delivery</td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">₹150</td>
                    <td className="px-6 py-4 text-gray-700">1-2 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              * Express delivery available only in select metro cities
            </p>
          </section>

          {/* Delivery Times */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Delivery Timeframes
            </h2>
            <div className="space-y-4">
              <div className="bg-primary-50 rounded-lg p-6">
                <h3 className="font-semibold text-primary-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Metro Cities
                </h3>
                <p className="text-gray-700">Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad</p>
                <p className="text-sm text-primary-600 font-semibold mt-2">⚡ 2-3 business days</p>
              </div>

              <div className="bg-primary-50 rounded-lg p-6">
                <h3 className="font-semibold text-primary-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Tier 2 Cities
                </h3>
                <p className="text-gray-700">Pune, Jaipur, Ahmedabad, Lucknow, etc.</p>
                <p className="text-sm text-primary-600 font-semibold mt-2">🚚 3-5 business days</p>
              </div>

              <div className="bg-primary-50 rounded-lg p-6">
                <h3 className="font-semibold text-primary-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Other Locations
                </h3>
                <p className="text-gray-700">Small towns and rural areas</p>
                <p className="text-sm text-primary-600 font-semibold mt-2">📦 5-7 business days</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Note:</strong> Delivery times may vary during peak seasons (festivals, sales) or due to unforeseen circumstances.
            </p>
          </section>

          {/* Order Processing */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Order Processing
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                All orders are processed within <strong>24-48 hours</strong> (excluding weekends and holidays). You will receive a confirmation email with tracking details once your order is shipped.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Processing Time:</h4>
                <ul className="space-y-2 ml-6">
                  <li>📦 <strong>In Stock Items:</strong> 24-48 hours</li>
                  <li>⚒️ <strong>Made-to-Order:</strong> 5-7 business days + delivery time</li>
                  <li>🛠️ <strong>Customized Products:</strong> 7-10 business days + delivery time</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Tracking Your Order */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Tracking Your Order
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">
                Track your order in real-time from your account:
              </p>
              <ol className="space-y-3 ml-6">
                <li><strong>1.</strong> Log in to your Radeo account</li>
                <li><strong>2.</strong> Go to &quot;My Orders&quot;</li>
                <li><strong>3.</strong> Click on the order you want to track</li>
                <li><strong>4.</strong> View tracking details and estimated delivery</li>
              </ol>
              <p className="mt-4 text-sm">
                You&apos;ll also receive email and SMS updates at every stage of delivery.
              </p>
            </div>
          </section>

          {/* Shipping Partners */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Our Shipping Partners
            </h2>
            <p className="text-gray-700 mb-4">
              We work with India&apos;s most trusted courier services to ensure safe and timely delivery:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center font-semibold text-gray-700">
                Blue Dart
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center font-semibold text-gray-700">
                Delhivery
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center font-semibold text-gray-700">
                FedEx
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center font-semibold text-gray-700">
                DTDC
              </div>
            </div>
          </section>

          {/* Delivery Issues */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Delivery Issues
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">What if I&apos;m not home?</h4>
              <p className="text-gray-700 mb-4">
                Our delivery partners will attempt delivery 2-3 times. If unsuccessful, the package will be held at the nearest courier office for 5 days. Contact us if you need to reschedule delivery.
              </p>
              
              <h4 className="font-semibold text-gray-900 mb-3 mt-6">Delayed Delivery?</h4>
              <p className="text-gray-700">
                If your order hasn&apos;t arrived within the expected timeframe, please <Link href="/contact" className="text-primary-600 hover:underline">contact us</Link> with your order number. We&apos;ll track it immediately and resolve the issue.
              </p>
            </div>
          </section>

          {/* International Shipping */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              International Shipping
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700">
                Currently, we only ship within India. We&apos;re working on expanding to international markets. Stay tuned!
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Want to be notified when we start international shipping? <Link href="/contact" className="text-primary-600 hover:underline">Contact us</Link> to join the waitlist.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-8 text-white">
            <h3 className="text-xl font-bold mb-3">
              Questions About Shipping?
            </h3>
            <p className="text-primary-100 mb-4">
              Our support team is here to help with any shipping-related queries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition-colors"
              >
                View FAQ
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
