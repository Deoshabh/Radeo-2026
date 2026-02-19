'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
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

/* ── Design tokens (now sourced from CSS variables set by theme admin) ── */
const getFooterVar = (name, fallback) => typeof window !== 'undefined'
  ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  : fallback;

// Static fallback constants (used in SSR and as defaults)
const FOOTER_BG_DEFAULT = '#1A1714';
const FOOTER_CREAM_DEFAULT = '#F0EBE1';
const FOOTER_GOLD_DEFAULT = '#B8973A';
const FOOTER_MUTED_DEFAULT = '#6B6560';
const FOOTER_COL_HEADER_DEFAULT = '#9A8E84';
const FOOTER_BORDER_DEFAULT = '#3A3530';
const FOOTER_LEGAL_BORDER_DEFAULT = '#2A2520';
const FOOTER_LEGAL_TEXT_DEFAULT = '#4A4540';

// CSS-variable-backed getters (fall back to hardcoded constants)
const useFooterColors = () => {
  const [colors, setColors] = useState({
    bg: FOOTER_BG_DEFAULT,
    cream: FOOTER_CREAM_DEFAULT,
    gold: FOOTER_GOLD_DEFAULT,
    muted: FOOTER_MUTED_DEFAULT,
    colHeader: FOOTER_COL_HEADER_DEFAULT,
    border: FOOTER_BORDER_DEFAULT,
    legalBorder: FOOTER_LEGAL_BORDER_DEFAULT,
    legalText: FOOTER_LEGAL_TEXT_DEFAULT,
  });

  useEffect(() => {
    const root = document.documentElement;
    const get = (varName, fallback) => getComputedStyle(root).getPropertyValue(varName).trim() || fallback;
    setColors({
      bg: get('--color-footer-bg', FOOTER_BG_DEFAULT),
      cream: get('--color-footer-text', FOOTER_CREAM_DEFAULT),
      gold: get('--color-footer-accent', FOOTER_GOLD_DEFAULT),
      muted: get('--color-footer-muted', FOOTER_MUTED_DEFAULT),
      colHeader: get('--color-footer-muted', FOOTER_COL_HEADER_DEFAULT),
      border: get('--color-footer-border', FOOTER_BORDER_DEFAULT),
      legalBorder: get('--color-footer-border', FOOTER_LEGAL_BORDER_DEFAULT),
      legalText: get('--color-footer-muted', FOOTER_LEGAL_TEXT_DEFAULT),
    });
  }, []);

  return colors;
};

export default function Footer() {
  const { settings } = useSiteSettings();
  const footerColors = useFooterColors();
  const FOOTER_BG = footerColors.bg;
  const FOOTER_CREAM = footerColors.cream;
  const FOOTER_GOLD = footerColors.gold;
  const FOOTER_MUTED = footerColors.muted;
  const FOOTER_COL_HEADER = footerColors.colHeader;
  const FOOTER_BORDER = footerColors.border;
  const FOOTER_LEGAL_BORDER = footerColors.legalBorder;
  const FOOTER_LEGAL_TEXT = footerColors.legalText;
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem 0' }}>

        {/* ═══ 4-COLUMN GRID ═══ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '25% 20% 20% 35%',
            gap: '0',
            alignItems: 'start',
          }}
          className="footer-grid"
        >
          {/* Col 1 — Brand */}
          <div style={{ paddingRight: '2rem' }}>
            <h3
              style={{
                fontFamily: "var(--font-playfair, 'Lora', serif)",
                fontSize: '24px',
                fontWeight: 400,
                marginBottom: '0.6rem',
                color: FOOTER_CREAM,
                letterSpacing: '0.08em',
              }}
            >
              {footerContent.brand?.name || 'RADEO'}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)",
                fontSize: '13px',
                lineHeight: 1.6,
                color: FOOTER_MUTED,
                marginBottom: '1rem',
                maxWidth: '220px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {footerContent.brand?.description ||
                'Premium handcrafted shoes made with timeless craftsmanship and finest materials.'}
            </p>
            {showSocials && socialLinks.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {socialLinks.map((social) => {
                  const Icon = SOCIAL_ICON_MAP[social.platform] || FiInstagram;
                  return (
                    <a
                      key={`${social.platform}-${social.order || 0}`}
                      href={social.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '32px',
                        height: '32px',
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
                      <Icon style={{ width: '14px', height: '14px' }} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Col 2 & 3 — Dynamic link columns (Quick Links, Customer Service) */}
          {!isMinimalLayout && columns.slice(0, 2).map((column) => (
            <div key={column.id || column.title} style={{ paddingRight: '1rem' }}>
              <h4
                style={{
                  fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: FOOTER_COL_HEADER,
                  marginBottom: '1rem',
                }}
              >
                {column.title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
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
                          fontSize: '13px',
                          lineHeight: 1.5,
                          display: 'inline-block',
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

          {/* Col 4 — Contact Us */}
          {!isMinimalLayout && (
            <div>
              <h4
                style={{
                  fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: FOOTER_COL_HEADER,
                  marginBottom: '1rem',
                }}
              >
                Contact Us
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {contact.showAddress && contact.address && (
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: FOOTER_MUTED, fontSize: '13px', lineHeight: 1.5 }}>
                    <FiMapPin style={{ width: '14px', height: '14px', marginTop: '2px', flexShrink: 0 }} />
                    <span>{contact.address}</span>
                  </li>
                )}
                {contact.showPhone && contact.phone && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                    <FiPhone style={{ width: '14px', height: '14px', flexShrink: 0, color: FOOTER_MUTED }} />
                    <a href={`tel:${String(contact.phone).replace(/\s+/g, '')}`} style={{ color: FOOTER_MUTED, textDecoration: 'none', transition: 'color 0.3s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = FOOTER_CREAM; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = FOOTER_MUTED; }}
                    >
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact.showEmail && contact.email && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                    <FiMail style={{ width: '14px', height: '14px', flexShrink: 0, color: FOOTER_MUTED }} />
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

        {/* ═══ DIVIDER ═══ */}
        <div style={{ height: '1px', background: FOOTER_LEGAL_BORDER, marginTop: '2rem' }} />

        {/* ═══ NEWSLETTER ROW — inline horizontal ═══ */}
        {showNewsletter && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem 0',
              gap: '2rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Left: label + subtitle + input inline */}
            <form
              onSubmit={handleNewsletterSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                flex: 1,
                minWidth: 0,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <h4
                  style={{
                    fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: FOOTER_COL_HEADER,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {footerContent.newsletter?.title || 'Newsletter'}
                </h4>
                <p
                  style={{
                    fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)",
                    fontSize: '12px',
                    color: FOOTER_MUTED,
                    margin: '4px 0 0',
                    lineHeight: 1.4,
                  }}
                >
                  {footerContent.newsletter?.description || 'Updates & exclusive offers'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'stretch', flex: '1 1 220px', maxWidth: '340px' }}>
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
                    padding: '0.5rem 0',
                    color: FOOTER_CREAM,
                    fontSize: '13px',
                    fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)",
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === 'submitting'}
                  aria-label="Subscribe"
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${FOOTER_BORDER}`,
                    color: FOOTER_GOLD,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.3s',
                    flexShrink: 0,
                  }}
                >
                  <FiArrowRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              {newsletterStatus === 'success' && (
                <span style={{ fontSize: '12px', color: FOOTER_MUTED, flexShrink: 0 }}>Subscribed!</span>
              )}
              {newsletterStatus === 'error' && (
                <span style={{ fontSize: '12px', color: '#B91C1C', flexShrink: 0 }}>Failed. Try again.</span>
              )}
            </form>

            {/* Right: brand stamp */}
            <span
              style={{
                fontFamily: "var(--font-playfair, 'Lora', serif)",
                fontSize: '11px',
                letterSpacing: '0.25em',
                color: FOOTER_LEGAL_TEXT,
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              Est. 2026
            </span>
          </div>
        )}

        {/* ═══ LEGAL BAR ═══ */}
        <div
          style={{
            borderTop: `1px solid ${FOOTER_LEGAL_BORDER}`,
            padding: '1rem 0 1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p style={{ fontSize: '12px', color: FOOTER_LEGAL_TEXT, margin: 0 }}>
            &copy; {currentYear} {footerContent.brand?.name || 'Radeo'}. {footerContent.legal?.copyrightText || 'All rights reserved.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            {legalLinks.map((link) => (
              <Link
                key={link.text}
                href={link.url || '/'}
                style={{
                  fontSize: '12px',
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
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              style={{
                width: '30px',
                height: '30px',
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
              <FiArrowUp style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-responsive override: stack on <1024px */}
      <style jsx>{`
        @media (max-width: 1023px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 639px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </footer>
  );
}
