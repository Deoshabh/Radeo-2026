'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiMail,
  FiPhone,
  FiMapPin,
} from 'react-icons/fi';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const SOCIAL_ICON_MAP = {
  facebook: FiFacebook,
  twitter: FiTwitter,
  instagram: FiInstagram,
};

export default function Footer() {
  const { settings } = useSiteSettings();
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle');

  const footerContent = settings.footerContent || {};
  const footerTheme = settings.theme?.footer || {};

  const contact = settings.contactInfo || {};
  const socialLinks = (settings.socialLinks || [])
    .filter((item) => item.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const columns = (footerContent.columns || [])
    .filter((column) => column.title)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const legalLinks = (footerContent.legal?.links || [])
    .filter((link) => link.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Theme Styles
  const bgColor = footerTheme.colors?.background || 'var(--color-primary-900)';
  const textColor = footerTheme.colors?.text || 'var(--color-background)';
  const showNewsletter = footerTheme.showNewsletter !== false;
  const showSocials = footerTheme.showSocialLinks !== false;
  const footerLayout = footerTheme.layout || '4-col';

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) {
      return;
    }

    try {
      setNewsletterStatus('submitting');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter Subscriber',
          email: newsletterEmail.trim(),
          message: 'Newsletter subscription request from footer',
        }),
      });

      if (!response.ok) {
        throw new Error('Newsletter request failed');
      }

      setNewsletterEmail('');
      setNewsletterStatus('success');
    } catch {
      setNewsletterStatus('error');
    }
  };

  const gridClassByLayout = {
    '4-col': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8',
    '2-col': 'grid grid-cols-1 md:grid-cols-2 gap-8',
  };

  const isCenteredLayout = footerLayout === 'centered';
  const isMinimalLayout = footerLayout === 'minimal';
  const shouldShowContact = !isMinimalLayout;
  const contentContainerClass = isCenteredLayout
    ? 'max-w-5xl mx-auto text-center'
    : (gridClassByLayout[footerLayout] || gridClassByLayout['4-col']);

  return (
    <footer
      className="mt-20 transition-colors duration-300"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="container-custom py-12">
        <div className={contentContainerClass}>
          <div>
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>{footerContent.brand?.name || 'Radeo'}</h3>
            <p className="opacity-80 mb-4" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)", fontSize: '1.1rem' }}>
              {footerContent.brand?.description ||
                'Premium handcrafted shoes made with timeless craftsmanship and finest materials.'}
            </p>
            {showSocials && socialLinks.length > 0 && (
              <div className={`flex gap-4 ${isCenteredLayout ? 'justify-center' : ''}`}>
                {socialLinks.map((social) => {
                  const Icon = SOCIAL_ICON_MAP[social.platform] || FiInstagram;
                  return (
                    <a
                      key={`${social.platform}-${social.order || 0}`}
                      href={social.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-75 transition-opacity"
                      style={{ color: textColor }}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {!isMinimalLayout && columns.map((column) => (
            <div key={column.id || column.title}>
              <h4 className="text-sm font-semibold mb-4 uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>{column.title}</h4>
              <ul className="space-y-2">
                {(column.links || [])
                  .filter((link) => link.enabled)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((link) => (
                    <li key={`${column.title}-${link.text}`}>
                      <Link
                        href={link.url || '/'}
                        className="opacity-70 hover:opacity-100 transition-opacity"
                        style={{ color: textColor }}
                      >
                        {link.text}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          {shouldShowContact && (
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>Contact Us</h4>
            <ul className="space-y-3">
              {contact.showAddress && contact.address && (
                <li className="flex items-start gap-2 opacity-80">
                  <FiMapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                  <span>{contact.address}</span>
                </li>
              )}
              {contact.showPhone && contact.phone && (
                <li className="flex items-center gap-2 opacity-80">
                  <FiPhone className="w-5 h-5" />
                  <a
                    href={`tel:${String(contact.phone).replace(/\s+/g, '')}`}
                    className="hover:opacity-100 transition-opacity"
                  >
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.showEmail && contact.email && (
                <li className="flex items-center gap-2 opacity-80">
                  <FiMail className="w-5 h-5" />
                  <a href={`mailto:${contact.email}`} className="hover:opacity-100 transition-opacity">
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
          )}
        </div>

        {footerTheme.showNewsletter !== false && (
          <div className="border-t mt-8 pt-8" style={{ borderColor: `${textColor}33` }}>
            <div className="max-w-md mx-auto text-center">
              <h4 className="text-sm font-semibold mb-2 uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>{footerContent.newsletter?.title || 'Subscribe to Our Newsletter'}</h4>
              <p className="opacity-80 mb-4" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>{footerContent.newsletter?.description || 'Get updates on new products and exclusive offers'}</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  required
                  placeholder={footerContent.newsletter?.placeholder || 'Enter your email'}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-tan placeholder-white/50"
                  style={{ color: textColor, borderColor: `${textColor}33` }}
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === 'submitting'}
                  className="btn px-6 font-medium"
                  style={{ backgroundColor: textColor, color: bgColor }}
                >
                  {footerContent.newsletter?.buttonText || 'Subscribe'}
                </button>
              </form>
              {newsletterStatus === 'success' && (
                <p className="mt-3 text-sm opacity-80">Subscription request sent successfully.</p>
              )}
              {newsletterStatus === 'error' && (
                <p className="mt-3 text-sm text-red-300">Unable to subscribe right now. Please try again.</p>
              )}
            </div>
          </div>
        )}

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: `${textColor}33` }}>
          <p className="opacity-70 text-sm">
            &copy; {currentYear} {footerContent.brand?.name || 'Radeo'}. {footerContent.legal?.copyrightText || 'All rights reserved.'}
          </p>
          <div className="flex gap-6 text-sm">
            {legalLinks.map((link) => (
              <Link key={link.text} href={link.url || '/'} className="opacity-70 hover:opacity-100 transition-opacity" style={{ color: textColor }}>
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
