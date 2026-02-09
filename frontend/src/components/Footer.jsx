'use client';

import Link from 'next/link';
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

  const footer = settings.footerContent || {};
  const contact = settings.contactInfo || {};
  const socialLinks = (settings.socialLinks || [])
    .filter((item) => item.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const columns = (footer.columns || [])
    .filter((column) => column.title)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const legalLinks = (footer.legal?.links || [])
    .filter((link) => link.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <footer className="bg-primary-900 text-white mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-serif font-bold mb-4">{footer.brand?.name || 'Radeo'}</h3>
            <p className="text-primary-300 mb-4">
              {footer.brand?.description ||
                'Premium handcrafted shoes made with timeless craftsmanship and finest materials.'}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = SOCIAL_ICON_MAP[social.platform] || FiInstagram;
                  return (
                    <a
                      key={`${social.platform}-${social.order || 0}`}
                      href={social.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-tan transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {columns.map((column) => (
            <div key={column.id || column.title}>
              <h4 className="text-lg font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {(column.links || [])
                  .filter((link) => link.enabled)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((link) => (
                    <li key={`${column.title}-${link.text}`}>
                      <Link href={link.url || '/'} className="text-primary-300 hover:text-white transition-colors">
                        {link.text}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              {contact.showAddress && contact.address && (
                <li className="flex items-start gap-2 text-primary-300">
                  <FiMapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                  <span>{contact.address}</span>
                </li>
              )}
              {contact.showPhone && contact.phone && (
                <li className="flex items-center gap-2 text-primary-300">
                  <FiPhone className="w-5 h-5" />
                  <a
                    href={`tel:${String(contact.phone).replace(/\s+/g, '')}`}
                    className="hover:text-white transition-colors"
                  >
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.showEmail && contact.email && (
                <li className="flex items-center gap-2 text-primary-300">
                  <FiMail className="w-5 h-5" />
                  <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {footer.newsletter?.enabled && (
          <div className="border-t border-primary-700 mt-8 pt-8">
            <div className="max-w-md mx-auto text-center">
              <h4 className="text-lg font-semibold mb-2">{footer.newsletter.title || 'Subscribe to Our Newsletter'}</h4>
              <p className="text-primary-300 mb-4">{footer.newsletter.description || 'Get updates on new products and exclusive offers'}</p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder={footer.newsletter.placeholder || 'Enter your email'}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-800 border border-primary-700 focus:outline-none focus:ring-2 focus:ring-brand-tan text-white placeholder-primary-400"
                />
                <button type="submit" className="btn bg-brand-brown hover:bg-brand-tan text-white px-6">
                  {footer.newsletter.buttonText || 'Subscribe'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="border-t border-primary-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-300 text-sm">
            &copy; {currentYear} {footer.brand?.name || 'Radeo'}. {footer.legal?.copyrightText || 'All rights reserved.'}
          </p>
          <div className="flex gap-6 text-sm">
            {legalLinks.map((link) => (
              <Link key={link.text} href={link.url || '/'} className="text-primary-300 hover:text-white transition-colors">
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
