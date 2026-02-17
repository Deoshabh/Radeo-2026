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
    <div className="min-h-screen bg-[#faf8f4]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-16">
        <div className="text-center mb-16">
          <p className="text-[11px] text-[#c9a96e] mb-3 uppercase tracking-[0.3em] font-medium" style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>Our Story</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#2a1a0a] mb-4" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
            {about.title || 'About Radeo'}
          </h1>
          <p className="text-xl text-[#8a7460] max-w-3xl mx-auto" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
            {about.subtitle}
          </p>
        </div>

        <div className="mb-16">
          <div className="bg-white/80 backdrop-blur-sm border border-[#e8e0d0] p-8 md:p-12">
            <h2 className="text-3xl font-bold text-[#2a1a0a] mb-6" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
              {about.storyTitle || 'Our Story'}
            </h2>
            <div className="prose prose-lg max-w-none text-[#5c3d1e] space-y-4" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
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
                <div key={value.id || value.title} className="bg-white/80 backdrop-blur-sm border border-[#e8e0d0] p-8">
                  <div className="w-12 h-12 bg-[#f2ede4] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#c9a96e]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2a1a0a] mb-3" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>{value.title}</h3>
                  <p className="text-[#8a7460]" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>{value.description}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-[#2a1a0a] p-8 md:p-12 text-[#f2ede4] mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
            {about.differentiatorsTitle || 'What Sets Us Apart'}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {differentiators.map((item) => (
              <div key={item.id || item.title} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-[#c9a96e]/20 flex items-center justify-center">
                    <FiCheck className="w-5 h-5 text-[#c9a96e]" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                  <p className="text-[#c4b8a4]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#2a1a0a] mb-4" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
            {about.cta?.title}
          </h2>
          <p className="text-xl text-[#8a7460] mb-8" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
            {about.cta?.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {about.cta?.primaryButtonText && about.cta?.primaryButtonLink && (
              <Link
                href={about.cta.primaryButtonLink}
                className="inline-flex items-center justify-center px-8 py-4 text-[12px] uppercase tracking-[0.2em] font-medium bg-[#2a1a0a] text-[#f2ede4] hover:bg-[#5c3d1e] transition-colors"
                style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
              >
                {about.cta.primaryButtonText}
              </Link>
            )}
            {about.cta?.secondaryButtonText && about.cta?.secondaryButtonLink && (
              <Link
                href={about.cta.secondaryButtonLink}
                className="inline-flex items-center justify-center px-8 py-4 text-[12px] uppercase tracking-[0.2em] font-medium border border-[#2a1a0a] text-[#2a1a0a] hover:bg-[#2a1a0a] hover:text-[#f2ede4] transition-colors"
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
