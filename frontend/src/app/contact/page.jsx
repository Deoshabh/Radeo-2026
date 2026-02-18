'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FiMail, FiMapPin, FiPhone, FiArrowRight, FiClock } from 'react-icons/fi';
import { contactAPI } from '@/utils/api';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useRecaptcha, RECAPTCHA_ACTIONS } from '@/utils/recaptcha';

const MAX_MESSAGE_LENGTH = 1000;

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const contactInfo = settings.contactInfo || {};
  const contactPage = settings.contactPage || {};
  const socialLinks = (settings.socialLinks || []).filter((item) => item.enabled && item.url);
  const { getToken } = useRecaptcha();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    if (e.target.name === 'message' && e.target.value.length > MAX_MESSAGE_LENGTH) return;
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
      const recaptchaToken = await getToken(RECAPTCHA_ACTIONS.CONTACT_FORM);
      await contactAPI.submit({ ...formData, recaptchaToken });
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Shared styles ── */
  const labelStyle = {
    fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#8A7E74',
    display: 'block',
    marginBottom: '8px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 0',
    fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
    fontSize: '15px',
    color: '#1A1714',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #D4CFC9',
    outline: 'none',
    transition: 'border-color 150ms ease',
  };

  const inputFocusHandler = (e) => { e.target.style.borderBottomColor = '#B8973A'; };
  const inputBlurHandler = (e) => { e.target.style.borderBottomColor = '#D4CFC9'; };

  return (
    <div className="min-h-screen" style={{ background: '#F7F5F1' }}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20">

        {/* ═══ HEADER — left-aligned ═══ */}
        <div className="mb-16">
          <p
            className="mb-3 uppercase"
            style={{
              fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
              fontSize: '10px',
              letterSpacing: '0.35em',
              color: '#B8973A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
            }}
          >
            <span style={{ display: 'inline-block', width: '24px', height: '1px', background: '#B8973A' }} />
            Get In Touch
          </p>
          <h1
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)",
              fontSize: 'clamp(2.4rem, 5vw, 3.2rem)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: '#1A1714',
              marginBottom: '12px',
            }}
          >
            {contactPage.title || 'Get in Touch'}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
              fontSize: '15px',
              lineHeight: 1.7,
              color: '#5A5047',
              maxWidth: '480px',
            }}
          >
            {contactPage.subtitle || "Have a question or need help? We're here for you."}
          </p>
        </div>

        {/* ═══ TWO-COLUMN LAYOUT — 60/40 ═══ */}
        <div className="grid lg:grid-cols-5 gap-16 lg:gap-20">

          {/* LEFT — Form (60%) */}
          <div className="lg:col-span-3">
            {contactPage.formEnabled !== false ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid sm:grid-cols-2 gap-8">
                  <div>
                    <label htmlFor="name" style={labelStyle}>Your Name *</label>
                    <input
                      type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
                      style={inputStyle} placeholder="John Doe"
                      onFocus={inputFocusHandler} onBlur={inputBlurHandler}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" style={labelStyle}>Email Address *</label>
                    <input
                      type="email" id="email" name="email" value={formData.email} onChange={handleChange} required
                      style={inputStyle} placeholder="john@example.com"
                      onFocus={inputFocusHandler} onBlur={inputBlurHandler}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" style={labelStyle}>Subject</label>
                  <input
                    type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange}
                    style={inputStyle} placeholder="How can we help?"
                    onFocus={inputFocusHandler} onBlur={inputBlurHandler}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label htmlFor="message" style={{ ...labelStyle, marginBottom: 0 }}>Message *</label>
                    <span style={{
                      fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
                      fontSize: '10px',
                      color: formData.message.length > MAX_MESSAGE_LENGTH * 0.9 ? '#B8973A' : '#A09890',
                    }}>
                      {formData.message.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                  </div>
                  <textarea
                    id="message" name="message" value={formData.message} onChange={handleChange} required
                    style={{
                      ...inputStyle,
                      minHeight: '120px',
                      resize: 'vertical',
                      borderBottom: '1px solid #D4CFC9',
                    }}
                    placeholder="Tell us more about your inquiry..."
                    onFocus={inputFocusHandler} onBlur={inputBlurHandler}
                  />
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 group"
                  style={{
                    height: '52px',
                    fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
                    fontSize: '13px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    background: isSubmitting ? '#8A7E74' : '#1A1714',
                    color: '#F0EBE1',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.background = '#2C2420'; }}
                  onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.background = '#1A1714'; }}
                >
                  {isSubmitting ? 'Sending...' : (
                    <>
                      Send Message
                      <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="py-20 text-center">
                <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '15px', color: '#8A7E74' }}>
                  Contact form is temporarily unavailable.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — Contact Info (40%) */}
          <div className="lg:col-span-2">
            <div className="space-y-8">

              {/* Contact rows — minimal, no card boxes */}
              {contactInfo.showEmail && contactInfo.email && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center" style={{ border: '1px solid #E5E2DC', borderRadius: '50%' }}>
                    <FiMail className="w-4 h-4" style={{ color: '#B8973A' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8A7E74', marginBottom: '4px' }}>Email</p>
                    <a href={`mailto:${contactInfo.email}`} style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '14px', color: '#1A1714', textDecoration: 'none' }}>
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo.showPhone && contactInfo.phone && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center" style={{ border: '1px solid #E5E2DC', borderRadius: '50%' }}>
                    <FiPhone className="w-4 h-4" style={{ color: '#B8973A' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8A7E74', marginBottom: '4px' }}>Phone</p>
                    <a href={`tel:${String(contactInfo.phone).replace(/\s+/g, '')}`} style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '14px', color: '#1A1714', textDecoration: 'none' }}>
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo.showAddress && contactInfo.address && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center" style={{ border: '1px solid #E5E2DC', borderRadius: '50%' }}>
                    <FiMapPin className="w-4 h-4" style={{ color: '#B8973A' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8A7E74', marginBottom: '4px' }}>Address</p>
                    <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '14px', color: '#1A1714', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {contactInfo.address}
                    </p>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: '1px', background: '#E5E2DC' }} />

              {/* Business Hours — clean table */}
              {(contactPage.businessHours || []).length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center" style={{ border: '1px solid #E5E2DC', borderRadius: '50%' }}>
                      <FiClock className="w-4 h-4" style={{ color: '#B8973A' }} />
                    </div>
                    <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8A7E74' }}>Business Hours</p>
                  </div>
                  <div className="space-y-2 ml-[52px]">
                    {(contactPage.businessHours || []).map((row) => (
                      <div key={row.day} className="flex justify-between gap-4">
                        <span style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '13px', color: '#5A5047' }}>{row.day}</span>
                        <span style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '13px', fontWeight: 500, color: '#1A1714' }}>{row.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div>
                  <div style={{ height: '1px', background: '#E5E2DC', marginBottom: '24px' }} />
                  <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8A7E74', marginBottom: '12px' }}>Follow Us</p>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
                          fontSize: '12px',
                          padding: '6px 14px',
                          border: '1px solid #E5E2DC',
                          color: '#1A1714',
                          textDecoration: 'none',
                          transition: 'border-color 150ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B8973A'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E2DC'; }}
                      >
                        {social.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ inline link — replaces the Quick Answers card */}
              {(contactPage.supportCard?.ctaLink || '/faq') && (
                <div style={{ marginTop: '16px' }}>
                  <Link
                    href={contactPage.supportCard?.ctaLink || '/faq'}
                    className="inline-flex items-center gap-2 group"
                    style={{
                      fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
                      fontSize: '13px',
                      color: '#B8973A',
                      textDecoration: 'none',
                    }}
                  >
                    Looking for quick answers? Visit our FAQ
                    <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
