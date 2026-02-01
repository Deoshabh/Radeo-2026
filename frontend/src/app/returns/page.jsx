import { Metadata } from 'next';
import Link from 'next/link';

export const metadata = {
  title: 'Return & Refund Policy - Radeo',
  description: 'Learn about our hassle-free return and refund policy. 7-day returns, easy process, and full refunds.',
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            Return & Refund Policy
          </h1>
          <p className="text-xl text-gray-600">
            We want you to love your purchase. If not, we make returns easy.
          </p>
        </div>

        {/* Quick Summary */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-xl p-8 text-white mb-12">
          <h2 className="text-2xl font-bold mb-4">Quick Summary</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>7-Day Return Window:</strong> Return products within 7 days of delivery</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Free Pickup:</strong> We'll collect the product from your doorstep</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Full Refund:</strong> Get 100% refund within 5-7 business days</span>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-10">
          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Eligibility for Returns
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">
                To be eligible for a return, your item must meet the following conditions:
              </p>
              <ul className="space-y-3 ml-6">
                <li>✓ Returned within <strong>7 days</strong> of delivery</li>
                <li>✓ Product must be <strong>unused and in original condition</strong></li>
                <li>✓ All original <strong>packaging, tags, and labels</strong> must be intact</li>
                <li>✓ Product should not show signs of wear or damage</li>
                <li>✓ Original invoice must be included with the return</li>
              </ul>
            </div>
          </section>

          {/* Non-Returnable Items */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Non-Returnable Items
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-gray-700 mb-3">The following items cannot be returned:</p>
              <ul className="space-y-2 text-gray-700 ml-6">
                <li>✗ Products marked as "Final Sale" or "Non-Returnable"</li>
                <li>✗ Worn, damaged, or altered products</li>
                <li>✗ Products without original packaging or tags</li>
                <li>✗ Products returned after 7 days from delivery</li>
              </ul>
            </div>
          </section>

          {/* Return Process */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              How to Return
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Initiate Return</h3>
                <p className="text-sm text-gray-600">Go to your orders and click "Return" on the product</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Select Reason</h3>
                <p className="text-sm text-gray-600">Tell us why you're returning the product</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Schedule Pickup</h3>
                <p className="text-sm text-gray-600">Choose a convenient time for pickup</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">4</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Refund</h3>
                <p className="text-sm text-gray-600">Receive refund within 5-7 business days</p>
              </div>
            </div>
          </section>

          {/* Refund Process */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Refund Process
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                Once we receive and inspect your returned product, we will process your refund within <strong>5-7 business days</strong>.
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                <h4 className="font-semibold text-primary-900 mb-3">Refund Method:</h4>
                <ul className="space-y-2 ml-6">
                  <li>💳 <strong>Online Payments:</strong> Refund to original payment method (card/UPI)</li>
                  <li>💰 <strong>Cash on Delivery:</strong> Bank transfer (requires bank details)</li>
                  <li>🎁 <strong>Store Credit:</strong> Instant credit to your Radeo wallet (optional)</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Bank processing times may vary. Please allow 2-3 additional business days for the refund to reflect in your account.
              </p>
            </div>
          </section>

          {/* Exchange Policy */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Exchange Policy
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                Currently, we do not offer direct exchanges. If you need a different size or color:
              </p>
              <ol className="space-y-3 ml-6 mt-4">
                <li><strong>1.</strong> Return the original product following our return process</li>
                <li><strong>2.</strong> Once refund is processed, place a new order for the desired item</li>
                <li><strong>3.</strong> Contact our support team - we may be able to expedite your new order</li>
              </ol>
            </div>
          </section>

          {/* Damaged/Defective Products */}
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Damaged or Defective Products
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-gray-700 mb-3">
                If you receive a damaged or defective product:
              </p>
              <ul className="space-y-2 text-gray-700 ml-6">
                <li>📸 Take clear photos of the product and packaging</li>
                <li>📞 Contact us within <strong>24 hours</strong> of delivery</li>
                <li>📧 Email photos to <a href="mailto:support@radeo.in" className="text-primary-600 hover:underline">support@radeo.in</a></li>
                <li>✅ We'll arrange immediate pickup and full refund</li>
              </ul>
              <p className="mt-4 text-sm text-gray-600">
                For damaged products, the 7-day return window does not apply. We accept returns at any reasonable time after you notice the defect.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-8 text-white">
            <h3 className="text-xl font-bold mb-3">
              Need Help with a Return?
            </h3>
            <p className="text-primary-100 mb-4">
              Our customer service team is here to assist you with any questions about returns or refunds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Contact Support
              </Link>
              <a
                href="mailto:support@radeo.in"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition-colors"
              >
                Email Us
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
