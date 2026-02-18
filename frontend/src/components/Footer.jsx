'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowUp,
  FiArrowRight,
} from 'react-icons/fi';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const SOCIAL_ICON_MAP = {
  facebook: FiFacebook,
  twitter: FiTwitter,
  instagram: FiInstagram,
};

/* ── Design tokens ── */
const FOOTER_BG = '#1A1714';
const FOOTER_CREAM = '#F0EBE1';
const FOOTER_GOLD = '#B8973A';
const FOOTER_MUTED = '#6B6560';
const FOOTER_COL_HEADER = '#9A8E84';
const FOOTER_BORDER = '#3A3530';
const FOOTER_LEGAL_BORDER = '#2A2520';
const FOOTER_LEGAL_TEXT = '#4A4540';

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

  const showNewsletter = footerTheme.showNewsletter !== false;
  const showSocials = footerTheme.showSocialLinks !== false;
  const isMinimalLayout = footerTheme.layout === 'minimal';

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) return;

    try {
      setNewsletterStatus('submitting');
      const response = await fetch(`/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter Subscriber',
          email: newsletterEmail.trim(),
          message: 'Newsletter subscription request from footer',
        }),
      });

      if (!response.ok) throw new Error('Newsletter request failed');

      setNewsletterEmail('');
      setNewsletterStatus('success');
    } catch {
      setNewsletterStatus('error');
    }
  };

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <footer
      className="mt-20"
      style={{ backgroundColor: FOOTER_BG, color: FOOTER_CREAM }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem 0' }}>

        {/* ═══ MAIN GRID ═══ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr repeat(auto-fit, minmax(140px, 1fr))',
            gap: '3rem',
          }}
        >
          {/* Brand column */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-playfair, 'Lora', serif)",
                fontSize: '28px',
                fontWeight: 400,
                marginBottom: '0.8rem',
                color: FOOTER_CREAM,
              }}
            >
              {footerContent.brand?.name || 'Radeo'}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)",
                fontSize: '14px',
                lineHeight: 1.7,
                color: FOOTER_MUTED,
                marginBottom: '1.5rem',
                maxWidth: '280px',
              }}
            >
              {footerContent.brand?.description ||
                'Premium handcrafted shoes made with timeless craftsmanship and finest materials.'}
            </p>

            {/* Social icons — 36px circles */}
            {showSocials && socialLinks.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {socialLinks.map((social) => {
                  const Icon = SOCIAL_ICON_MAP[social.platform] || FiInstagram;
                  return (
                    <a
                      key={`${social.platform}-${social.order || 0}`}
                      href={social.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: `1px solid ${FOOTER_BORDER}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: FOOTER_CREAM,
                        transition: 'border-color 0.3s, color 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = FOOTER_GOLD;
                        e.currentTarget.style.color = FOOTER_GOLD;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = FOOTER_BORDER;
                        e.currentTarget.style.color = FOOTER_CREAM;
                      }}
                    >
                      <Icon style={{ width: '16px', height: '16px' }} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic columns */}
          {!isMinimalLayout && columns.map((column) => (
            <div key={column.id || column.title}>
              <h4
                style={{
                  fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: FOOTER_COL_HEADER,
                  marginBottom: '1.2rem',
                }}
              >
                {column.title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(column.links || [])
                  .filter((link) => link.enabled)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((link) => (
                    <li key={`${column.title}-${link.text}`}>
                      <Link
                        href={link.url || '/'}
                        style={{
                          color: FOOTER_MUTED,
                          textDecoration: 'none',
                          fontSize: '14px',
                          lineHeight: 1.6,
                          display: 'inline-block',
                          position: 'relative',
                          transition: 'color 0.3s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = FOOTER_CREAM; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = FOOTER_MUTED; }}
                      >
                        {link.text}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          {!isMinimalLayout && (
            <div>
              <h4
                style={{
                  fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: FOOTER_COL_HEADER,
                  marginBottom: '1.2rem',
                }}
              >
                Contact Us
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {contact.showAddress && contact.address && (
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: FOOTER_MUTED, fontSize: '14px' }}>
                    <FiMapPin style={{ width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }} />
                    <span>{contact.address}</span>
                  </li>
                )}
                {contact.showPhone && contact.phone && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '14px' }}>
                    <FiPhone style={{ width: '16px', height: '16px', flexShrink: 0, color: FOOTER_MUTED }} />
                    <a href={`tel:${String(contact.phone).replace(/\s+/g, '')}`} style={{ color: FOOTER_MUTED, textDecoration: 'none', transition: 'color 0.3s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = FOOTER_CREAM; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = FOOTER_MUTED; }}
                    >
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact.showEmail && contact.email && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '14px' }}>
                    <FiMail style={{ width: '16px', height: '16px', flexShrink: 0, color: FOOTER_MUTED }} />
                    <a href={`mailto:${contact.email}`} style={{ color: FOOTER_MUTED, textDecoration: 'none', transition: 'color 0.3s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = FOOTER_CREAM; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = FOOTER_MUTED; }}
                    >
                      {contact.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* ═══ NEWSLETTER — left-aligned, bottom-border input + gold arrow ═══ */}
        {showNewsletter && (
          <div
            style={{
              borderTop: `1px solid ${FOOTER_BORDER}`,
              marginTop: '3rem',
              paddingTop: '2.5rem',
              paddingBottom: '0.5rem',
            }}
          >
            <div style={{ maxWidth: '480px' }}>
              <h4
                style={{
                  fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: FOOTER_COL_HEADER,
                  marginBottom: '0.5rem',
                }}
              >
                {footerContent.newsletter?.title || 'Subscribe to Our Newsletter'}
              </h4>
              <p
                style={{
                  fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)",
                  fontSize: '14px',
                  color: FOOTER_MUTED,
                  marginBottom: '1.2rem',
                  lineHeight: 1.6,
                }}
              >
                {footerContent.newsletter?.description || 'Get updates on new products and exclusive offers'}
              </p>
              <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  required
                  placeholder={footerContent.newsletter?.placeholder || 'Enter your email'}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${FOOTER_BORDER}`,
                    padding: '0.75rem 0',
                    color: FOOTER_CREAM,
                    fontSize: '14px',
                    fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)",
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === 'submitting'}
                  aria-label="Subscribe"
                  style={{
                    width: '44px',
                    height: '44px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${FOOTER_BORDER}`,
                    color: FOOTER_GOLD,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.3s',
                  }}
                >
                  <FiArrowRight style={{ width: '18px', height: '18px' }} />
                </button>
              </form>
              {newsletterStatus === 'success' && (
                <p style={{ marginTop: '0.75rem', fontSize: '13px', color: FOOTER_MUTED }}>Subscription request sent successfully.</p>
              )}
              {newsletterStatus === 'error' && (
                <p style={{ marginTop: '0.75rem', fontSize: '13px', color: '#B91C1C' }}>Unable to subscribe right now. Please try again.</p>
              )}
            </div>
          </div>
        )}

        {/* ═══ LEGAL ROW + Back-to-top ═══ */}
        <div
          style={{
            borderTop: `1px solid ${FOOTER_LEGAL_BORDER}`,
            marginTop: '2.5rem',
            padding: '1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <p style={{ fontSize: '13px', color: FOOTER_LEGAL_TEXT, margin: 0 }}>
            &copy; {currentYear} {footerContent.brand?.name || 'Radeo'}. {footerContent.legal?.copyrightText || 'All rights reserved.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {legalLinks.map((link) => (
              <Link
                key={link.text}
                href={link.url || '/'}
                style={{
                  fontSize: '13px',
                  color: FOOTER_LEGAL_TEXT,
                  textDecoration: 'none',
                  transition: 'color 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = FOOTER_CREAM; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = FOOTER_LEGAL_TEXT; }}
              >
                {link.text}
              </Link>
            ))}
            {/* Back to top */}
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: `1px solid ${FOOTER_BORDER}`,
                background: 'transparent',
                color: FOOTER_MUTED,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.3s, color 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = FOOTER_GOLD;
                e.currentTarget.style.color = FOOTER_GOLD;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = FOOTER_BORDER;
                e.currentTarget.style.color = FOOTER_MUTED;
              }}
            >
              <FiArrowUp style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
