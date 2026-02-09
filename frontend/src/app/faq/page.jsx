'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function FAQPage() {
  const { settings } = useSiteSettings();
  const faqPage = settings.faqPage || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [openQuestion, setOpenQuestion] = useState(null);

  const faqCategories = useMemo(() => {
    return (faqPage.categories || [])
      .filter((category) => category.enabled)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((category) => ({
        ...category,
        questions: (category.questions || [])
          .filter((question) => question.enabled)
          .sort((a, b) => (a.order || 0) - (b.order || 0)),
      }));
  }, [faqPage.categories]);

  const toggleQuestion = (categoryKey, questionKey) => {
    const key = `${categoryKey}-${questionKey}`;
    setOpenQuestion(openQuestion === key ? null : key);
  };

  const filteredFaqs = searchQuery
    ? faqCategories
        .map((category) => ({
          ...category,
          questions: category.questions.filter(
            (item) =>
              item.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.answer?.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((category) => category.questions.length > 0)
    : faqCategories;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            {faqPage.title || 'Frequently Asked Questions'}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {faqPage.subtitle || 'Find answers to common questions about Radeo'}
          </p>

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

        {!searchQuery && faqCategories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-primary-900 mb-4">
              Popular Topics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {faqCategories.map((category, index) => (
                <button
                  key={category.id || category.name}
                  onClick={() => {
                    const element = document.getElementById(`category-${index}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-medium transition-colors text-left"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {filteredFaqs.map((category, categoryIndex) => (
            <div
              key={category.id || category.name}
              id={`category-${categoryIndex}`}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-primary-900 mb-6">
                {category.name}
              </h2>
              <div className="space-y-4">
                {category.questions.map((item, questionIndex) => {
                  const rowKey = `${category.id || categoryIndex}-${item.id || questionIndex}`;
                  const isOpen = openQuestion === rowKey;

                  return (
                    <div
                      key={item.id || questionIndex}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(category.id || categoryIndex, item.id || questionIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">
                          {item.question}
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
                          <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {searchQuery && filteredFaqs.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-600 mb-6">
              We could not find any FAQs matching &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-primary"
            >
              Clear Search
            </button>
          </div>
        )}

        <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">
            {faqPage.supportTitle || 'Still have questions?'}
          </h2>
          <p className="text-primary-100 mb-6 text-lg">
            {faqPage.supportDescription || 'Our customer support team is here to help you'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={faqPage.supportPrimaryLink || '/contact'}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              {faqPage.supportPrimaryText || 'Contact Support'}
            </Link>
            <a
              href={faqPage.supportSecondaryLink || 'mailto:support@radeo.in'}
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition-colors border-2 border-primary-500"
            >
              {faqPage.supportSecondaryText || 'Email Us'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
