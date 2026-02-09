'use client';

import Link from 'next/link';
import { FiMapPin, FiCheck } from 'react-icons/fi';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { getIconComponent } from '@/utils/iconMapper';

export default function ShippingPage() {
  const { settings } = useSiteSettings();
  const shipping = settings.shippingPolicy || {};

  const highlights = shipping.highlights || [];
  const shippingCosts = shipping.shippingCosts || [];
  const deliveryZones = shipping.deliveryZones || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            {shipping.title || 'Shipping Information'}
          </h1>
          <p className="text-xl text-gray-600">
            {shipping.subtitle || 'Fast, reliable delivery to your doorstep'}
          </p>
        </div>

        {highlights.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {highlights.map((highlight) => {
              const Icon = getIconComponent(highlight.icon, FiCheck);
              return (
                <div key={highlight.id || highlight.title} className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-primary-900 mb-2">{highlight.title}</h3>
                  <p className="text-gray-600">{highlight.description}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-10">
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
                  {shippingCosts.map((row, index) => (
                    <tr key={row.id || index} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 text-gray-700">{row.orderValue}</td>
                      <td className="px-6 py-4 text-gray-700 font-semibold">
                        {row.badgeText ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            {row.badgeText}
                          </span>
                        ) : (
                          row.cost
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{row.deliveryTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shippingCosts.some((row) => row.note) && (
              <p className="text-sm text-gray-600 mt-4">
                * {shippingCosts.find((row) => row.note)?.note}
              </p>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Delivery Timeframes
            </h2>
            <div className="space-y-4">
              {deliveryZones.map((zone) => (
                <div key={zone.id || zone.zone} className="bg-primary-50 rounded-lg p-6">
                  <h3 className="font-semibold text-primary-900 mb-3 flex items-center">
                    <FiMapPin className="w-5 h-5 mr-2" />
                    {zone.zone}
                  </h3>
                  <p className="text-gray-700">{zone.cities}</p>
                  <p className="text-sm text-primary-600 font-semibold mt-2">{zone.time}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Order Processing</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>{shipping.processing?.summary}</p>
              {(shipping.processing?.points || []).length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Processing Time:</h4>
                  <ul className="space-y-2 ml-6">
                    {(shipping.processing?.points || []).map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Tracking Your Order</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <ol className="space-y-3 ml-6">
                {(shipping.trackingSteps || []).map((step, index) => (
                  <li key={step}><strong>{index + 1}.</strong> {step}</li>
                ))}
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Our Shipping Partners</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(shipping.shippingPartners || []).map((partner) => (
                <div key={partner} className="bg-gray-50 rounded-lg p-4 text-center font-semibold text-gray-700">
                  {partner}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Delivery Issues</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">What if I am not home?</h4>
              <p className="text-gray-700 mb-4">{shipping.deliveryIssues?.notHome}</p>

              <h4 className="font-semibold text-gray-900 mb-3 mt-6">Delayed Delivery?</h4>
              <p className="text-gray-700">{shipping.deliveryIssues?.delayed}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">International Shipping</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700">{shipping.international?.message}</p>
              {shipping.international?.waitlistText && (
                <p className="text-sm text-gray-600 mt-3">{shipping.international.waitlistText}</p>
              )}
            </div>
          </section>

          <section className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-8 text-white">
            <h3 className="text-xl font-bold mb-3">{shipping.support?.title}</h3>
            <p className="text-primary-100 mb-4">{shipping.support?.description}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={shipping.support?.primaryLink || '/contact'}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                {shipping.support?.primaryText || 'Contact Support'}
              </Link>
              <Link
                href={shipping.support?.secondaryLink || '/faq'}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition-colors"
              >
                {shipping.support?.secondaryText || 'View FAQ'}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
