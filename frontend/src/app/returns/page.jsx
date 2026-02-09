'use client';

import Link from 'next/link';
import { FiCheck } from 'react-icons/fi';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function ReturnsPage() {
  const { settings } = useSiteSettings();
  const returnsPolicy = settings.returnsPolicy || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            {returnsPolicy.title || 'Return & Refund Policy'}
          </h1>
          <p className="text-xl text-gray-600">
            {returnsPolicy.subtitle || 'We want you to love your purchase. If not, we make returns easy.'}
          </p>
        </div>

        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-xl p-8 text-white mb-12">
          <h2 className="text-2xl font-bold mb-4">Quick Summary</h2>
          <ul className="space-y-3">
            {(returnsPolicy.quickSummary || []).map((item) => (
              <li key={item.id || item.title} className="flex items-start">
                <FiCheck className="w-6 h-6 mr-3 flex-shrink-0" />
                <span><strong>{item.title}:</strong> {item.description}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Eligibility for Returns</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <ul className="space-y-3 ml-6">
                {(returnsPolicy.eligibilityCriteria || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Non-Returnable Items</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <ul className="space-y-2 text-gray-700 ml-6">
                {(returnsPolicy.nonReturnableItems || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">How to Return</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {(returnsPolicy.returnProcess || []).map((step) => (
                <div key={step.id || step.step} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary-600">{step.step}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Refund Process</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>{returnsPolicy.refundPolicy?.processingTime}</p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                <h4 className="font-semibold text-primary-900 mb-3">Refund Method:</h4>
                <ul className="space-y-2 ml-6">
                  {(returnsPolicy.refundPolicy?.methods || []).map((method) => (
                    <li key={method}>{method}</li>
                  ))}
                </ul>
              </div>
              {returnsPolicy.refundPolicy?.note && (
                <p className="text-sm text-gray-600">{returnsPolicy.refundPolicy.note}</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Exchange Policy</h2>
            <ol className="space-y-3 ml-6 mt-4 text-gray-700">
              {(returnsPolicy.exchangePolicy || []).map((item, index) => (
                <li key={item}><strong>{index + 1}.</strong> {item}</li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Damaged or Defective Products</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-gray-700 mb-3">{returnsPolicy.damagedProductPolicy?.intro}</p>
              <ul className="space-y-2 text-gray-700 ml-6">
                {(returnsPolicy.damagedProductPolicy?.steps || []).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
              {returnsPolicy.damagedProductPolicy?.note && (
                <p className="mt-4 text-sm text-gray-600">
                  {returnsPolicy.damagedProductPolicy.note}
                </p>
              )}
            </div>
          </section>

          <section className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-8 text-white">
            <h3 className="text-xl font-bold mb-3">
              {returnsPolicy.support?.title || 'Need Help with a Return?'}
            </h3>
            <p className="text-primary-100 mb-4">
              {returnsPolicy.support?.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={returnsPolicy.support?.primaryLink || '/contact'}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                {returnsPolicy.support?.primaryText || 'Contact Support'}
              </Link>
              <a
                href={returnsPolicy.support?.secondaryLink || 'mailto:support@radeo.in'}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition-colors"
              >
                {returnsPolicy.support?.secondaryText || 'Email Us'}
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
