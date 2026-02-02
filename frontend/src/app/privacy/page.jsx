'use client';

import { FiShield, FiLock, FiEye, FiDatabase } from 'react-icons/fi';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-primary-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-brown text-white rounded-full mb-4">
              <FiShield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-primary-600">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-primary-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Introduction</h2>
              <p className="leading-relaxed">
                Welcome to Radeo. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you visit 
                our website and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FiDatabase className="w-6 h-6 text-brand-brown mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-semibold text-primary-900 mb-4">Information We Collect</h2>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-primary-900 mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Name and contact information (email address, phone number)</li>
                    <li>Delivery address and billing information</li>
                    <li>Payment information (processed securely through payment gateways)</li>
                    <li>Order history and purchase preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900 mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>IP address and browser type</li>
                    <li>Device information and operating system</li>
                    <li>Browsing behavior and page interactions</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FiEye className="w-6 h-6 text-brand-brown mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-semibold text-primary-900 mb-4">How We Use Your Information</h2>
                </div>
              </div>
              <p className="leading-relaxed mb-4">We use your personal information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Processing and fulfilling your orders</li>
                <li>Communicating with you about your orders and account</li>
                <li>Providing customer support and responding to inquiries</li>
                <li>Improving our website, products, and services</li>
                <li>Sending marketing communications (with your consent)</li>
                <li>Preventing fraud and ensuring website security</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-start gap-3 mb-4">
                <FiLock className="w-6 h-6 text-brand-brown mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-semibold text-primary-900 mb-4">Data Security</h2>
                </div>
              </div>
              <p className="leading-relaxed">
                We have implemented appropriate security measures to prevent your personal data from being 
                accidentally lost, used, or accessed in an unauthorized way. We use industry-standard 
                encryption (SSL/TLS) for data transmission and secure payment processing through trusted 
                payment gateways. Access to your personal data is limited to employees and contractors 
                who need to access it for legitimate business purposes.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Data Sharing</h2>
              <p className="leading-relaxed mb-4">
                We do not sell your personal information to third parties. We may share your data with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Payment processors to complete transactions</li>
                <li>Shipping partners to deliver your orders</li>
                <li>Service providers who assist in our business operations</li>
                <li>Legal authorities when required by law</li>
              </ul>
              <p className="leading-relaxed mt-4">
                All third parties are required to maintain the security and confidentiality of your personal data.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Your Privacy Rights</h2>
              <p className="leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="leading-relaxed mt-4">
                To exercise any of these rights, please contact us using the information provided below.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Cookies</h2>
              <p className="leading-relaxed">
                We use cookies and similar tracking technologies to improve your browsing experience, 
                analyze website traffic, and personalize content. You can control cookie settings through 
                your browser preferences. However, disabling cookies may affect the functionality of our website.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Children's Privacy</h2>
              <p className="leading-relaxed">
                Our services are not directed to individuals under the age of 18. We do not knowingly 
                collect personal information from children. If you believe we have collected information 
                from a child, please contact us immediately.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new privacy policy on this page and updating the "Last updated" date. 
                We encourage you to review this policy periodically.
              </p>
            </section>

            {/* Contact Us */}
            <section className="border-t border-primary-200 pt-8">
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">Contact Us</h2>
              <p className="leading-relaxed mb-4">
                If you have any questions about this privacy policy or our privacy practices, please contact us:
              </p>
              <div className="bg-primary-50 rounded-lg p-6 space-y-2">
                <p><strong>Email:</strong> privacy@radeo.in</p>
                <p><strong>Website:</strong> www.radeo.in</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
