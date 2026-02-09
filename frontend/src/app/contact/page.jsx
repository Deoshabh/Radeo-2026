'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FiMail, FiMapPin, FiPhone, FiArrowRight } from 'react-icons/fi';
import { contactAPI } from '@/utils/api';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const contactInfo = settings.contactInfo || {};
  const contactPage = settings.contactPage || {};
  const socialLinks = (settings.socialLinks || []).filter((item) => item.enabled && item.url);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await contactAPI.submitMessage(formData);
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            {contactPage.title || 'Get in Touch'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {contactPage.subtitle || "Have a question or need help? We're here for you!"}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {contactPage.formEnabled !== false ? (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-primary py-4 text-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 flex items-center justify-center">
              <p className="text-gray-600 text-lg">Contact form is temporarily unavailable.</p>
            </div>
          )}

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">
                Contact Information
              </h2>

              <div className="space-y-6">
                {contactInfo.showEmail && contactInfo.email && (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FiMail className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                      <a href={`mailto:${contactInfo.email}`} className="text-primary-600 hover:text-primary-700">
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>
                )}

                {contactInfo.showPhone && contactInfo.phone && (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FiPhone className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                      <a href={`tel:${String(contactInfo.phone).replace(/\s+/g, '')}`} className="text-primary-600 hover:text-primary-700">
                        {contactInfo.phone}
                      </a>
                    </div>
                  </div>
                )}

                {contactInfo.showAddress && contactInfo.address && (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FiMapPin className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                      <p className="text-gray-600 whitespace-pre-line">{contactInfo.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {socialLinks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Follow Us</h3>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                      >
                        {social.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-lg p-8 text-white">
              <h3 className="text-xl font-bold mb-3">
                {contactPage.supportCard?.title || 'Quick Answers'}
              </h3>
              <p className="text-primary-100 mb-4">
                {contactPage.supportCard?.description ||
                  'Looking for immediate help? Check out our FAQ section for answers to common questions.'}
              </p>
              <Link
                href={contactPage.supportCard?.ctaLink || '/faq'}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                {contactPage.supportCard?.ctaText || 'Visit FAQ'}
                <FiArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-primary-900 mb-4">
                Business Hours
              </h3>
              <div className="space-y-2 text-gray-600">
                {(contactPage.businessHours || []).map((row) => (
                  <div key={row.day} className="flex justify-between gap-4">
                    <span>{row.day}</span>
                    <span className="font-medium text-right">{row.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
