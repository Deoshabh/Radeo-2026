'use client';

import Link from 'next/link';
import { FiCheck } from 'react-icons/fi';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { getIconComponent } from '@/utils/iconMapper';

export default function AboutPage() {
  const { settings } = useSiteSettings();
  const about = settings.aboutPage || {};

  const values = (about.values || [])
    .filter((item) => item.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const differentiators = (about.differentiators || [])
    .filter((item) => item.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            {about.title || 'About Radeo'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {about.subtitle}
          </p>
        </div>

        <div className="mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-primary-900 mb-6">
              {about.storyTitle || 'Our Story'}
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              {(about.storyParagraphs || []).map((paragraph, index) => (
                <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {values.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {values.map((value) => {
              const Icon = getIconComponent(value.icon, FiCheck);
              return (
                <div key={value.id || value.title} className="bg-white rounded-xl shadow-lg p-8">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-xl p-8 md:p-12 text-white mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {about.differentiatorsTitle || 'What Sets Us Apart'}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {differentiators.map((item) => (
              <div key={item.id || item.title} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <FiCheck className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                  <p className="text-primary-100">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary-900 mb-4">
            {about.cta?.title}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {about.cta?.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {about.cta?.primaryButtonText && about.cta?.primaryButtonLink && (
              <Link
                href={about.cta.primaryButtonLink}
                className="btn btn-primary text-lg px-8 py-4"
              >
                {about.cta.primaryButtonText}
              </Link>
            )}
            {about.cta?.secondaryButtonText && about.cta?.secondaryButtonLink && (
              <Link
                href={about.cta.secondaryButtonLink}
                className="btn btn-secondary text-lg px-8 py-4"
              >
                {about.cta.secondaryButtonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
