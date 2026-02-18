'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSiteSettings } from '@/context/SiteSettingsContext';

/* ── Brand-appropriate fallback images (leather craft, workshop) ── */
const BRAND_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1600&h=600&fit=crop&q=80',
  story: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=600&fit=crop&q=80',
};

export default function AboutPage() {
  const { settings } = useSiteSettings();
  const about = settings.aboutPage || {};

  const values = (about.values || [])
    .filter((item) => item.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const differentiators = (about.differentiators || [])
    .filter((item) => item.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const heroImage = about.heroImage || BRAND_IMAGES.hero;
  const storyImage = about.storyImage || BRAND_IMAGES.story;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-page-bg, #FAF8F4)', fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)" }}>

      {/* ═══ HERO BANNER ═══ */}
      <div className="relative h-[360px] md:h-[440px] overflow-hidden">
        <Image
          src={heroImage}
          alt={about.title || 'About Radeo'}
          fill
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(26,23,20,0.82) 0%, rgba(26,23,20,0.35) 50%, transparent 100%)' }}
        />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-10 pb-14 w-full">
            <p
              className="mb-3 uppercase font-medium"
              style={{
                fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
                fontSize: '10px',
                letterSpacing: '0.35em',
                color: '#B8973A',
              }}
            >
              Our Story
            </p>
            <h1
              className="mb-4"
              style={{
                fontFamily: "var(--font-playfair, 'Lora', serif)",
                fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
                fontWeight: 400,
                lineHeight: 1.05,
                color: '#F0EBE1',
              }}
            >
              {about.title || 'About Radeo'}
            </h1>
            <p
              className="max-w-xl"
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.7,
                color: '#E8E0D0',
              }}
            >
              {about.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20">

        {/* ═══ STORY SECTION — editorial layout with drop-cap ═══ */}
        <div className="mb-24">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Image — staggered offset */}
            <div className="md:col-span-5 md:mt-12 relative aspect-[4/3] overflow-hidden">
              <Image
                src={storyImage}
                alt={about.storyTitle || 'Our Story'}
                fill
                className="object-cover"
              />
            </div>
            {/* Content */}
            <div className="md:col-span-7 md:pl-8">
              <p
                className="mb-4 uppercase"
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
                Heritage
              </p>
              <h2
                className="mb-6"
                style={{
                  fontFamily: "var(--font-playfair, 'Lora', serif)",
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: 'var(--color-heading, #2a1a0a)',
                }}
              >
                {about.storyTitle || 'Our Story'}
              </h2>
              <div style={{ color: 'var(--color-body, #8a7460)', lineHeight: 1.9, fontSize: '1.05rem' }}>
                {(about.storyParagraphs || []).map((paragraph, index) => (
                  <p key={`${paragraph.slice(0, 20)}-${index}`} style={{ marginBottom: '1rem' }}>
                    {index === 0 ? (
                      <>
                        <span style={{
                          float: 'left',
                          fontFamily: "var(--font-playfair, 'Lora', serif)",
                          fontSize: '3.8rem',
                          lineHeight: 0.85,
                          fontWeight: 400,
                          color: '#B8973A',
                          marginRight: '8px',
                          marginTop: '4px',
                        }}>
                          {paragraph.charAt(0)}
                        </span>
                        {paragraph.slice(1)}
                      </>
                    ) : paragraph}
                  </p>
                ))}
              </div>

              {/* ── Pull Quote ── */}
              {about.storyQuote && (
                <blockquote className="relative mt-8 mb-6 pl-6" style={{ borderLeft: 'none' }}>
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: '-16px',
                      left: '-8px',
                      fontFamily: "var(--font-playfair, 'Lora', serif)",
                      fontSize: '80px',
                      lineHeight: 1,
                      color: '#B8973A',
                      opacity: 0.25,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    &ldquo;
                  </span>
                  <p
                    style={{
                      fontFamily: "var(--font-playfair, 'Lora', serif)",
                      fontStyle: 'italic',
                      fontSize: '1.25rem',
                      lineHeight: 1.7,
                      color: '#B8973A',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {about.storyQuote}
                  </p>
                </blockquote>
              )}
            </div>
          </div>
        </div>

        {/* ═══ VALUES — full-width horizontal strips with large gold numbers ═══ */}
        {values.length > 0 && (
          <div className="mb-24">
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
              Our Values
            </p>
            <h2
              className="mb-12"
              style={{
                fontFamily: "var(--font-playfair, 'Lora', serif)",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 400,
                lineHeight: 1.1,
                color: 'var(--color-heading, #2a1a0a)',
              }}
            >
              Crafted with Purpose
            </h2>
            <div>
              {values.map((value, i) => (
                <div
                  key={value.id || value.title}
                  className="flex items-start gap-8 md:gap-12 py-8"
                  style={{
                    borderTop: '1px solid #E5E2DC',
                    ...(i === values.length - 1 ? { borderBottom: '1px solid #E5E2DC' } : {}),
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-playfair, 'Lora', serif)",
                      fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                      fontWeight: 300,
                      lineHeight: 1,
                      color: '#B8973A',
                      minWidth: '60px',
                      opacity: 0.7,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1">
                    <h3
                      className="mb-2"
                      style={{
                        fontFamily: "var(--font-playfair, 'Lora', serif)",
                        fontSize: '1.3rem',
                        fontWeight: 600,
                        color: 'var(--color-heading, #2a1a0a)',
                      }}
                    >
                      {value.title}
                    </h3>
                    <p style={{ color: 'var(--color-body, #8a7460)', lineHeight: 1.7, fontSize: '0.95rem', maxWidth: '600px' }}>
                      {value.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ DIFFERENTIATORS — 2×2 stat-style callouts ═══ */}
        {differentiators.length > 0 && (
          <div className="mb-24">
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
              What Sets Us Apart
            </p>
            <h2
              className="mb-12"
              style={{
                fontFamily: "var(--font-playfair, 'Lora', serif)",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 400,
                lineHeight: 1.1,
                color: 'var(--color-heading, #2a1a0a)',
              }}
            >
              {about.differentiatorsTitle || 'What Sets Us Apart'}
            </h2>
            <div className="grid sm:grid-cols-2 gap-0">
              {differentiators.map((item, i) => (
                <div
                  key={item.id || item.title}
                  className="p-8 md:p-10"
                  style={{
                    borderTop: '1px solid #E5E2DC',
                    borderRight: i % 2 === 0 ? '1px solid #E5E2DC' : 'none',
                  }}
                >
                  <div
                    className="mb-4"
                    style={{
                      fontFamily: "var(--font-playfair, 'Lora', serif)",
                      fontSize: '2.5rem',
                      fontWeight: 300,
                      lineHeight: 1,
                      color: '#B8973A',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3
                    className="mb-3"
                    style={{
                      fontFamily: "var(--font-playfair, 'Lora', serif)",
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      color: 'var(--color-heading, #2a1a0a)',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ color: 'var(--color-body, #8a7460)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ FULL-WIDTH DARK CTA PANEL ═══ */}
      {about.cta && (
        <div style={{ background: '#1A1714' }}>
          <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20 text-center">
            <h2
              className="mb-4"
              style={{
                fontFamily: "var(--font-playfair, 'Lora', serif)",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 400,
                color: '#F0EBE1',
              }}
            >
              {about.cta?.title}
            </h2>
            <p
              className="mb-10 mx-auto max-w-lg"
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.7,
                color: '#A09890',
              }}
            >
              {about.cta?.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {about.cta?.primaryButtonText && about.cta?.primaryButtonLink && (
                <Link
                  href={about.cta.primaryButtonLink}
                  className="inline-flex items-center justify-center px-10 transition-colors"
                  style={{
                    fontFamily: "var(--font-dm-mono, monospace)",
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    height: '56px',
                    background: '#B8973A',
                    color: '#1A1714',
                  }}
                >
                  {about.cta.primaryButtonText}
                </Link>
              )}
              {about.cta?.secondaryButtonText && about.cta?.secondaryButtonLink && (
                <Link
                  href={about.cta.secondaryButtonLink}
                  className="inline-flex items-center justify-center px-10 transition-colors"
                  style={{
                    fontFamily: "var(--font-dm-mono, monospace)",
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    height: '56px',
                    border: '1px solid #4A4540',
                    color: '#E8E0D0',
                    background: 'transparent',
                  }}
                >
                  {about.cta.secondaryButtonText}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
