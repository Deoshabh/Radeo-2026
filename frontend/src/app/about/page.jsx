'use client';

import Link from 'next/link';
import Image from 'next/image';
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

  const heroImage = about.heroImage || 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1600&h=600&fit=crop&q=80';
  const storyImage = about.storyImage || 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800&h=600&fit=crop&q=80';

  return (
    <div className="min-h-screen bg-[color:var(--color-page-bg)]">
      {/* Hero Banner */}
      <div className="relative h-[320px] md:h-[400px] overflow-hidden">
        <Image
          src={heroImage}
          alt={about.title || 'About Radeo'}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-heading)]/80 via-[color:var(--color-heading)]/40 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-10 pb-12 w-full">
            <p className="text-[11px] text-[color:var(--color-accent)] mb-3 uppercase tracking-[0.3em] font-medium" style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>Our Story</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
              {about.title || 'About Radeo'}
            </h1>
            <p className="text-xl text-[color:var(--color-border-light)] max-w-3xl" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
              {about.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-16">
        {/* Story Section with Image */}
        <div className="mb-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="relative aspect-[4/3] overflow-hidden border border-[color:var(--color-border-light)]">
              <Image
                src={storyImage}
                alt={about.storyTitle || 'Our Story'}
                fill
                className="object-cover"
              />
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-[color:var(--color-border-light)] p-8 md:p-10">
              <h2 className="text-3xl font-bold text-[color:var(--color-heading)] mb-6" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
                {about.storyTitle || 'Our Story'}
              </h2>
              <div className="prose prose-lg max-w-none text-[color:var(--color-muted)] space-y-4" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
                {(about.storyParagraphs || []).map((paragraph, index) => (
                  <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {values.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {values.map((value) => {
              const Icon = getIconComponent(value.icon, FiCheck);
              return (
                <div key={value.id || value.title} className="bg-white/80 backdrop-blur-sm border border-[color:var(--color-border-light)] p-8">
                  <div className="w-12 h-12 bg-[color:var(--color-subtle-bg)] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[color:var(--color-accent)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[color:var(--color-heading)] mb-3" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>{value.title}</h3>
                  <p className="text-[color:var(--color-body)]" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>{value.description}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-[color:var(--color-heading)] p-8 md:p-12 text-[color:var(--color-subtle-bg)] mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
            {about.differentiatorsTitle || 'What Sets Us Apart'}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {differentiators.map((item) => (
              <div key={item.id || item.title} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-[color:var(--color-accent)]/20 flex items-center justify-center">
                    <FiCheck className="w-5 h-5 text-[color:var(--color-accent)]" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                  <p className="text-[color:var(--color-body)]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-[color:var(--color-heading)] mb-4" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
            {about.cta?.title}
          </h2>
          <p className="text-xl text-[color:var(--color-body)] mb-8" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
            {about.cta?.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {about.cta?.primaryButtonText && about.cta?.primaryButtonLink && (
              <Link
                href={about.cta.primaryButtonLink}
                className="inline-flex items-center justify-center px-8 py-4 text-[12px] uppercase tracking-[0.2em] font-medium bg-[color:var(--color-heading)] text-[color:var(--color-subtle-bg)] hover:bg-[color:var(--color-muted)] transition-colors"
                style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
              >
                {about.cta.primaryButtonText}
              </Link>
            )}
            {about.cta?.secondaryButtonText && about.cta?.secondaryButtonLink && (
              <Link
                href={about.cta.secondaryButtonLink}
                className="inline-flex items-center justify-center px-8 py-4 text-[12px] uppercase tracking-[0.2em] font-medium border border-[color:var(--color-heading)] text-[color:var(--color-heading)] hover:bg-[color:var(--color-heading)] hover:text-[color:var(--color-subtle-bg)] transition-colors"
                style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
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
