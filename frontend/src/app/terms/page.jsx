'use client';

import { FiFileText, FiPackage, FiCreditCard, FiAlertCircle } from 'react-icons/fi';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-primary-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-brown text-white rounded-full mb-4">
              <FiFileText className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-primary-600">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-primary-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Introduction</h2>
              <p className="leading-relaxed">
                Welcome to Radeo ("we", "our", or "us"). These Terms of Service ("Terms") govern your 
                access to and use of our website and services. By accessing or using our services, you 
                agree to be bound by these Terms. If you do not agree with any part of these Terms, you 
                may not access our services.
              </p>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Account Registration</h2>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>You must be at least 18 years old to create an account and make purchases</li>
                <li>You must provide accurate, current, and complete information during registration</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must notify us immediately of any unauthorized access to your account</li>
                <li>You are responsible for all activities that occur under your account</li>
              </ul>
            </section>

            {/* Products and Pricing */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FiPackage className="w-6 h-6 text-brand-brown mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-semibold text-primary-900 mb-4">Products and Pricing</h2>
                </div>
              </div>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  We make every effort to display accurate product information, including descriptions, 
                  images, and prices. However:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Product colors may vary slightly due to monitor settings</li>
                  <li>We reserve the right to correct pricing errors on our website</li>
                  <li>Product availability is subject to change without notice</li>
                  <li>All prices are in Indian Rupees (INR) and include applicable taxes</li>
                  <li>We reserve the right to modify prices at any time</li>
                </ul>
              </div>
            </section>

            {/* Orders and Payment */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FiCreditCard className="w-6 h-6 text-brand-brown mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-semibold text-primary-900 mb-4">Orders and Payment</h2>
                </div>
              </div>
              <div className="space-y-4">
                <p className="leading-relaxed">When you place an order:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your order constitutes an offer to purchase products</li>
                  <li>We reserve the right to accept or reject your order for any reason</li>
                  <li>Payment must be made at the time of order placement</li>
                  <li>We accept payments through Razorpay and Cash on Delivery (COD)</li>
                  <li>You must ensure sufficient funds are available for the transaction</li>
                  <li>We are not responsible for payment gateway failures or bank transaction issues</li>
                </ul>
              </div>
            </section>

            {/* Shipping and Delivery */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Shipping and Delivery</h2>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>Delivery times are estimates and not guaranteed</li>
                <li>Shipping charges are calculated based on delivery location and order value</li>
                <li>We are not responsible for delays caused by courier services or unforeseen circumstances</li>
                <li>You must provide accurate delivery address information</li>
                <li>Failed delivery attempts due to incorrect address may result in additional charges</li>
                <li>Risk of loss passes to you upon delivery to the carrier</li>
              </ul>
            </section>

            {/* Cancellation and Returns */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Cancellation and Returns</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-primary-900 mb-2">Order Cancellation</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You can cancel orders before they are shipped</li>
                    <li>Once an order is shipped, it cannot be cancelled</li>
                    <li>Refunds for cancelled orders will be processed within 5-7 business days</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900 mb-2">Returns and Refunds</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Products can be returned within 7 days of delivery</li>
                    <li>Products must be unused, unworn, and in original packaging</li>
                    <li>Return shipping costs may be borne by the customer unless the product is defective</li>
                    <li>Refunds will be issued to the original payment method</li>
                    <li>Certain products may be non-returnable (marked as such on product pages)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Prohibited Activities */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FiAlertCircle className="w-6 h-6 text-brand-brown mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-semibold text-primary-900 mb-4">Prohibited Activities</h2>
                </div>
              </div>
              <p className="leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use our services for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Infringe upon intellectual property rights</li>
                <li>Transmit viruses, malware, or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Engage in fraudulent activities or payment disputes</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use automated systems to access our website (bots, scrapers)</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Intellectual Property</h2>
              <p className="leading-relaxed">
                All content on our website, including text, graphics, logos, images, and software, is the 
                property of Radeo or its licensors and is protected by copyright, trademark, and other 
                intellectual property laws. You may not reproduce, distribute, modify, or create derivative 
                works without our express written permission.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Limitation of Liability</h2>
              <p className="leading-relaxed mb-4">
                To the fullest extent permitted by law:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                <li>Our total liability shall not exceed the amount paid by you for the product</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>We are not responsible for third-party content or services</li>
              </ul>
            </section>

            {/* Disclaimer of Warranties */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Disclaimer of Warranties</h2>
              <p className="leading-relaxed">
                Our services are provided "as is" and "as available" without any warranties of any kind, 
                either express or implied. We do not warrant that our services will meet your requirements 
                or that the operation will be uninterrupted or error-free.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India. 
                Any disputes arising from these Terms shall be subject to the exclusive jurisdiction 
                of the courts in [Your City], India.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Changes to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes will be effective 
                immediately upon posting on our website. Your continued use of our services after 
                changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Termination</h2>
              <p className="leading-relaxed">
                We may terminate or suspend your account and access to our services immediately, 
                without prior notice, for any reason, including violation of these Terms. Upon 
                termination, your right to use our services will cease immediately.
              </p>
            </section>

            {/* Contact Us */}
            <section className="border-t border-primary-200 pt-8">
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Contact Us</h2>
              <p className="leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-primary-50 rounded-lg p-6 space-y-2">
                <p><strong>Email:</strong> support@radeo.in</p>
                <p><strong>Website:</strong> www.radeo.in</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
