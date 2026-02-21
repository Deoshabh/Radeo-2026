'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import anime from 'animejs';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { SITE_SETTINGS_DEFAULTS } from '@/constants/siteSettingsDefaults';
import IntroSplash from './IntroSplash';
import s from './RadeoHome.module.css';
import { formatPrice } from '@/utils/helpers';

/* ── Helpers ── */
const MINIO_BASE = process.env.NEXT_PUBLIC_MINIO_URL || '';
const FALLBACK = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect fill='%23f2ede4' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='18' fill='%23c9a96e'%3ERADEO%3C/text%3E%3C/svg%3E`;

/* Unsplash demo images for leather shoes */
const DEMO_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&h=1600&fit=crop&q=80',
  craft: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=1200&h=800&fit=crop&q=80',
  ],
  heritage: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1200&h=900&fit=crop&q=80',
  story: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=900&fit=crop&q=80',
};

function imgSrc(url) {
  if (!url) return FALLBACK;
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) return url;
  return `${MINIO_BASE}/${url}`;
}

function RImg({ src, alt, className, width, height, loading, style, fill, sizes }) {
  const [s2, setS2] = useState(() => imgSrc(src));
  const onError = useCallback(() => setS2(FALLBACK), []);
  useEffect(() => { setS2(imgSrc(src)); }, [src]);
  if (fill) {
    return <Image src={s2} alt={alt || ''} fill sizes={sizes || '100vw'} className={className} style={style} onError={onError} />;
  }
  return <Image src={s2} alt={alt || ''} className={className} width={width || 800} height={height || 600} loading={loading} style={style} onError={onError} />;
}

/* ═══════════════════════════════════════════════════════════
   RADEO HOME — Admin-controlled luxury landing page
   ═══════════════════════════════════════════════════════════ */
export default function RadeoHome() {
  const { settings } = useSiteSettings();
  const hp = useMemo(() => {
    const def = SITE_SETTINGS_DEFAULTS.homePage;
    const live = settings?.homePage || {};
    return {
      hero: { ...def.hero, ...(live.hero || {}), stats: live.hero?.stats?.length ? live.hero.stats : def.hero.stats },
      marquee: { ...def.marquee, ...(live.marquee || {}) },
      collection: { ...def.collection, ...(live.collection || {}) },
      craft: { ...def.craft, ...(live.craft || {}), images: live.craft?.images?.length ? live.craft.images : def.craft.images, features: live.craft?.features?.length ? live.craft.features : def.craft.features },
      heritage: { ...def.heritage, ...(live.heritage || {}), points: live.heritage?.points?.length ? live.heritage.points : def.heritage.points },
      story: { ...def.story, ...(live.story || {}), paragraphs: live.story?.paragraphs?.length ? live.story.paragraphs : def.story.paragraphs },
      testimonials: { ...def.testimonials, ...(live.testimonials || {}), items: live.testimonials?.items?.length ? live.testimonials.items : def.testimonials.items },
      ctaBanner: { ...def.ctaBanner, ...(live.ctaBanner || {}) },
    };
  }, [settings]);

  const rootRef = useRef(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [products, setProducts] = useState([]);
  const hasAnimated = useRef(false);

  /* ── Fetch real products for Collection section ── */
  useEffect(() => {
    if (!hp.collection.enabled || !hp.collection.useRealProducts) return;
    const limit = hp.collection.productLimit || 4;
    const selection = hp.collection.productSelection || 'latest';
    let url = `/api/v1/products?limit=${limit}`;
    if (selection === 'top-rated') url = `/api/v1/products/top-rated?limit=${limit}`;
    if (selection === 'featured') url = `/api/v1/products?featured=true&limit=${limit}`;

    fetch(url).then(r => r.json()).then(data => {
      const prods = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []);
      setProducts(prods.slice(0, limit));
    }).catch(() => setProducts([]));
  }, [hp.collection.enabled, hp.collection.useRealProducts, hp.collection.productLimit, hp.collection.productSelection]);

  /* ── Hero entrance — triggered after IntroSplash completes or on revisit ── */
  useEffect(() => {
    if (hasAnimated.current) return;
    // Check if intro was already seen (revisit)
    const alreadySeen = typeof window !== 'undefined' && sessionStorage.getItem('radeo_intro_seen');
    if (alreadySeen || introComplete) {
      hasAnimated.current = true;
      runHeroEntrance();
    }
  }, [introComplete]);

  function runHeroEntrance() {
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    tl.add({ targets: `.${s.heroEyebrow}`, opacity: [0, 1], translateX: [20, 0], duration: 600 });
    tl.add({ targets: `.${s.heroTitleLine} span`, translateY: ['110%', '0%'], duration: 900, delay: anime.stagger(130) }, '-=400');
    tl.add({ targets: `.${s.heroDesc}`, opacity: [0, 1], translateY: [20, 0], duration: 700 }, '-=500');
    tl.add({ targets: [`.${s.btnPrimary}`, `.${s.btnGhost}`], opacity: [0, 1], translateY: [15, 0], duration: 600, delay: anime.stagger(100) }, '-=400');
    tl.add({ targets: `.${s.heroStats}`, opacity: [0, 1], translateY: [20, 0], duration: 600 }, '-=400');
    tl.add({ targets: `.${s.heroImg}`, scale: [1.08, 1.0], opacity: [0, 1], duration: 1200, easing: 'easeOutQuad' }, '-=800');
    tl.add({ duration: 1, complete: () => {
      document.querySelectorAll(`.${s.heroStatNum}`).forEach(el => {
        const target = parseInt(el.getAttribute('data-target'), 10);
        const obj = { val: 0 };
        anime({ targets: obj, val: target, round: 1, duration: 2000, easing: 'easeOutExpo', update: () => { el.textContent = Math.floor(obj.val); } });
      });
    }});
  }

  /* ── Scroll Reveals ── */
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        if (el.classList.contains(s.revealLabel)) anime({ targets: el, opacity: [0, 1], translateY: [16, 0], duration: 600, easing: 'easeOutExpo' });
        if (el.classList.contains(s.revealHead)) { anime({ targets: el, opacity: [0, 1], duration: 100 }); anime({ targets: el.querySelectorAll(':scope .rhLine span'), translateY: ['110%', '0%'], duration: 800, delay: anime.stagger(100), easing: 'easeOutExpo' }); }
        if (el.classList.contains(s.revealCard)) anime({ targets: el, opacity: [0, 1], translateY: [36, 0], duration: 800, easing: 'easeOutExpo', delay });
        if (el.classList.contains(s.revealImg)) { anime({ targets: el, opacity: [0, 1], duration: 100 }); const img = el.querySelector('img'); if (img) anime({ targets: img, scale: [1.06, 1.0], opacity: [0, 1], duration: 1000, easing: 'easeOutExpo', delay }); }
        if (el.classList.contains(s.revealSplitL)) anime({ targets: el, opacity: [0, 1], translateX: [-40, 0], duration: 800, easing: 'easeOutExpo' });
        if (el.classList.contains(s.revealSplitR)) anime({ targets: el, opacity: [0, 1], translateX: [40, 0], duration: 800, easing: 'easeOutExpo' });
        if (el.classList.contains(s.revealFeature)) anime({ targets: el, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: 'easeOutExpo', delay });
        if (el.classList.contains(s.revealQuote)) anime({ targets: el, opacity: [0, 1], translateY: [24, 0], duration: 900, easing: 'easeOutExpo' });
      });
    }, { threshold: 0.15 });

    const timer = setTimeout(() => {
      const root = rootRef.current;
      if (!root) return;
      const cls = [s.revealLabel, s.revealHead, s.revealCard, s.revealImg, s.revealSplitL, s.revealSplitR, s.revealFeature, s.revealQuote].map(c => `.${c}`).join(', ');
      root.querySelectorAll(cls).forEach(el => { if (!el.closest(`.${s.hero}`)) observer.observe(el); });
    }, 100);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [products]); // Re-run when products load so new .revealCard elements get observed

  /* ── Parallax ── */
  useEffect(() => {
    const heroImg = rootRef.current?.querySelector(`.${s.heroImg}`);
    const heroContent = rootRef.current?.querySelector(`.${s.heroContent}`);
    function onScroll() {
      const sy = window.scrollY;
      if (sy < window.innerHeight * 1.5) {
        if (heroImg) heroImg.style.transform = `translateY(${sy * 0.6}px) scale(1.1)`;
        if (heroContent) heroContent.style.transform = `translateY(${sy * 0.06}px)`;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── 3D Tilt ── */
  useEffect(() => {
    const cards = rootRef.current?.querySelectorAll(`.${s.productCard}`);
    if (!cards) return;
    const h = [];
    cards.forEach(card => {
      const onMove = e => { const r = card.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5; const y = (e.clientY - r.top) / r.height - 0.5; card.style.transform = `perspective(900px) rotateX(${y * -12}deg) rotateY(${x * 12}deg)`; };
      const onLeave = () => { anime({ targets: card, rotateX: 0, rotateY: 0, duration: 600, easing: 'easeOutElastic(1, 0.5)' }); card.style.transform = ''; };
      card.addEventListener('mousemove', onMove); card.addEventListener('mouseleave', onLeave);
      h.push({ card, onMove, onLeave });
    });
    return () => h.forEach(({ card, onMove, onLeave }) => { card.removeEventListener('mousemove', onMove); card.removeEventListener('mouseleave', onLeave); });
  }, [products]);

  /* ── Magnetic buttons ── */
  useEffect(() => {
    const btns = rootRef.current?.querySelectorAll(`.${s.btnPrimary}, .${s.btnLight}`);
    if (!btns) return;
    const h = [];
    btns.forEach(btn => {
      const onMove = e => { const r = btn.getBoundingClientRect(); btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.28}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`; };
      const onLeave = () => { anime({ targets: btn, translateX: 0, translateY: 0, duration: 800, easing: 'easeOutElastic(1, 0.5)' }); };
      btn.addEventListener('mousemove', onMove); btn.addEventListener('mouseleave', onLeave);
      h.push({ btn, onMove, onLeave });
    });
    return () => h.forEach(({ btn, onMove, onLeave }) => { btn.removeEventListener('mousemove', onMove); btn.removeEventListener('mouseleave', onLeave); });
  }, []);

  /* ── Testimonial carousel ── */
  useEffect(() => {
    const len = hp.testimonials.items?.length || 1;
    const iv = setInterval(() => setTestimonialIdx(i => (i + 1) % len), 6000);
    return () => clearInterval(iv);
  }, [hp.testimonials.items]);

  /* ── Product helpers ── */
  function getProductImage(p) { if (p?.images?.length) return p.images[0].url || p.images[0]; return p?.image || FALLBACK; }
  function getProductHoverImage(p) { if (p?.images?.length > 1) return p.images[1].url || p.images[1]; return getProductImage(p); }
  function getProductPrice(p) { return p?.price ? formatPrice(Number(p.price)) : ''; }
  function getProductComparePrice(p) { return (p?.comparePrice && p.comparePrice > p.price) ? formatPrice(Number(p.comparePrice)) : ''; }
  function getProductDiscount(p) { return (p?.comparePrice && p.comparePrice > p.price) ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0; }
  function getProductTag(p) { return p?.category?.name || p?.tags?.[0] || ''; }

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div className={s.radeoRoot} ref={rootRef}>

      {/* ─── INTRO SPLASH (first visit only) ─── */}
      <IntroSplash onComplete={() => setIntroComplete(true)} />

      {/* ─── HERO ─── */}
      {hp.hero.enabled !== false && (
        <section className={s.hero}>
          <div className={s.heroImgCol}>
            <RImg src={hp.hero.image || DEMO_IMAGES.hero} alt="RADEO editorial" className={s.heroImg} width={1200} height={1600} />
            <div className={s.heroImgOverlay}></div>
          </div>
          <div className={s.heroContent}>
            <div className={s.heroEyebrow}>{hp.hero.eyebrow}</div>
            <h1 className={s.heroTitle}>
              <span className={s.heroTitleLine}><span>{hp.hero.titleLine1}</span></span>
              <span className={s.heroTitleLine}><span className={s.heroTitleItalic}>{hp.hero.titleLine2}</span></span>
              <span className={s.heroTitleLine}><span>{hp.hero.titleLine3}</span></span>
            </h1>
            <p className={s.heroDesc}>{hp.hero.description}</p>
            <div className={s.heroCtas}>
              <Link href={hp.hero.primaryButtonLink || '/products'}><button className={s.btnPrimary}>{hp.hero.primaryButtonText}</button></Link>
              <Link href={hp.hero.secondaryButtonLink || '#craft'} className={s.heroTextCta}>{hp.hero.secondaryButtonText} <span className={s.heroCtaArrow}>→</span></Link>
            </div>
            <div className={s.heroStats}>
              {(hp.hero.stats || []).map((st, i) => (
                <div key={i} className={s.heroStat}>
                  <span className={s.heroStatNum} data-target={st.value}>0</span>{st.suffix || ''} {st.label}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── MARQUEE ─── */}
      {hp.marquee.enabled !== false && (
        <div className={s.marquee}>
          <div className={s.marqueeInner}>
            <span className={s.marqueeText}>{hp.marquee.text}</span>
            <span className={s.marqueeText}>{hp.marquee.text}</span>
          </div>
        </div>
      )}

      {/* ─── COLLECTION ─── */}
      {hp.collection.enabled !== false && (
        <section className={`${s.section} ${s.collectionBg}`} id="collection">
          <div className={s.container}>
            <div className={`${s.sectionLabel} ${s.revealLabel}`}>{hp.collection.label}</div>
            <h2 className={`${s.sectionHead} ${s.revealHead}`}>
              <span className="rhLine"><span>{hp.collection.title}</span></span>
            </h2>
            <div className={s.productsGrid}>
              {products.length > 0 ? products.map((p, i) => (
                <Link href={`/products/${p.slug || p._id}`} key={p._id || i} className={s.productCardLink}>
                  <div className={`${s.productCard} ${s.revealCard}`} data-delay={i * 80}>
                    <div className={s.cardImgWrap}>
                      <RImg src={getProductImage(p)} alt={p.name} className={s.cardImgMain} width={800} height={1000} loading="lazy" />
                      <RImg src={getProductHoverImage(p)} alt={`${p.name} alt`} className={s.cardImgHover} width={800} height={1000} loading="lazy" />
                    </div>
                    <div className={s.cardInfo}>
                      <span className={s.cardTag}>{getProductTag(p)}</span>
                      <h3 className={s.cardName}>{p.name}</h3>
                      <div className={s.cardFooter}>
                        <span className={s.cardPrice}>{getProductPrice(p)}</span>
                        {getProductComparePrice(p) && <span className={s.cardPriceOld}>{getProductComparePrice(p)}</span>}
                        {getProductDiscount(p) > 0 && <span className={s.cardDiscount}>{getProductDiscount(p)}% OFF</span>}
                      </div>
                    </div>
                    {(p.isNew || getProductDiscount(p) > 0) && (
                      <span className={s.cardBadge}>{p.isNew ? 'New' : `${getProductDiscount(p)}% OFF`}</span>
                    )}
                  </div>
                </Link>
              )) : (
                <p className={s.emptyMsg}>Products coming soon...</p>
              )}
            </div>
            <div className={s.sectionCta}>
              <Link href="/products"><button className={s.btnPrimary}>View All Products</button></Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── CRAFT ─── */}
      {hp.craft.enabled !== false && (
        <section className={`${s.section} ${s.craftBg}`} id="craft">
          <div className={s.container}>
            <div className={`${s.sectionLabel} ${s.revealLabel}`}>{hp.craft.label}</div>
            <h2 className={`${s.sectionHead} ${s.revealHead}`}>
              <span className="rhLine"><span>{hp.craft.titleLine1}</span></span>
              <span className="rhLine"><span>{hp.craft.titleLine2}</span></span>
            </h2>
            <div className={s.craftGrid}>
              {(hp.craft.images || []).map((img, i) => (
                <div key={img.id || i} className={`${s.craftImgWrap} ${s.revealImg}`} data-delay={i * 120}>
                  <RImg src={img.url || DEMO_IMAGES.craft[i] || FALLBACK} alt={img.alt} width={1200} height={800} loading="lazy" />
                </div>
              ))}
            </div>
            <div className={s.craftFeatures}>
              {(hp.craft.features || []).map((f, i) => (
                <div key={f.num || i} className={`${s.craftFeature} ${s.revealFeature}`} data-delay={i * 80}>
                  <div className={s.craftFeatureNum}>{f.num}</div>
                  <div className={s.craftFeatureName}>{f.name}</div>
                  <p className={s.craftFeatureDesc}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── HERITAGE / AGRA ─── */}
      {hp.heritage.enabled !== false && (
        <section className={`${s.section} ${s.heritageBg}`} id="heritage">
          <div className={s.container}>
            <div className={s.heritageGrid}>
              <div className={`${s.heritageContent} ${s.revealSplitL}`}>
                <div className={s.sectionLabel}>{hp.heritage.label}</div>
                <h2 className={s.sectionHead}>
                  <span className="rhLine"><span>{hp.heritage.titleLine1}</span></span>
                  <span className="rhLine"><span className={s.heroTitleItalic}>{hp.heritage.titleLine2}</span></span>
                </h2>
                <p className={s.heritageDesc}>{hp.heritage.description}</p>
                <div className={s.heritagePoints}>
                  {(hp.heritage.points || []).map((pt, i) => (
                    <div key={i} className={`${s.heritagePoint} ${s.revealFeature}`} data-delay={i * 100}>
                      <span className={s.heritagePointIcon}>{pt.icon}</span>
                      <div>
                        <strong className={s.heritagePointTitle}>{pt.title}</strong>
                        <p className={s.heritagePointDesc}>{pt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`${s.heritageImgWrap} ${s.revealSplitR}`}>
                <RImg src={hp.heritage.image || DEMO_IMAGES.heritage} alt="RADEO atelier in Agra" width={1200} height={900} loading="lazy" />
                <div className={s.heritageImgBadge}>
                  <span>🇮🇳</span>
                  <span>Made in India</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── STORY ─── */}
      {hp.story.enabled !== false && (
        <section className={`${s.section} ${s.storyBg}`} id="about">
          <div className={s.container}>
            <div className={s.storyGrid}>
              <div className={`${s.storyImgWrap} ${s.revealSplitL}`}>
                <RImg src={hp.story.image || DEMO_IMAGES.story} alt="RADEO founder" width={1200} height={900} loading="lazy" />
              </div>
              <div className={`${s.storyContent} ${s.revealSplitR}`}>
                <div className={s.sectionLabel}>{hp.story.label}</div>
                <h2 className={s.sectionHead}>
                  <span className="rhLine"><span>{hp.story.titleLine1}</span></span>
                  <span className="rhLine"><span>{hp.story.titleLine2}</span></span>
                </h2>
                {(hp.story.paragraphs || []).map((p, i) => <p key={i} className={s.storyBody}>{p}</p>)}
                {hp.story.quote && <blockquote className={s.storyQuote}>&ldquo;{hp.story.quote}&rdquo;</blockquote>}
                <Link href={hp.story.ctaLink || '/about'} className={s.storyCta}>{hp.story.ctaText || 'Our Story'} <span>→</span></Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── TESTIMONIALS ─── */}
      {hp.testimonials.enabled !== false && hp.testimonials.items?.length > 0 && (
        <section className={`${s.section} ${s.testimonialsBg}`}>
          <div className={s.container}>
            <div className={`${s.testimonialWrap} ${s.revealQuote}`}>
              <div className={s.testimonialStars}>{'★'.repeat(hp.testimonials.items[testimonialIdx]?.rating || 5)}</div>
              <p className={s.testimonialQuote}>&ldquo;{hp.testimonials.items[testimonialIdx]?.text}&rdquo;</p>
              <p className={s.testimonialAuthor}>— {hp.testimonials.items[testimonialIdx]?.author}</p>
              <div className={s.testimonialNav}>
                {hp.testimonials.items.map((_, i) => (
                  <button key={i} className={`${s.testimonialDot} ${i === testimonialIdx ? s.testimonialDotActive : ''}`} onClick={() => setTestimonialIdx(i)} aria-label={`Testimonial ${i + 1}`} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA BANNER ─── */}
      {hp.ctaBanner.enabled !== false && (
        <section className={`${s.section} ${s.ctaBanner}`}>
          <div className={s.ctaGrain}></div>
          <div className={s.container}>
            <h2 className={`${s.ctaBannerHead} ${s.revealHead}`}>
              <span className="rhLine"><span>{hp.ctaBanner.titleLine1}</span></span>
              <span className="rhLine"><span><em>{hp.ctaBanner.titleLine2}</em></span></span>
            </h2>
            <p className={`${s.ctaBannerSub} ${s.revealLabel}`}>{hp.ctaBanner.subtitle}</p>
            <div className={s.ctaBannerBtns}>
              <Link href={hp.ctaBanner.primaryButtonLink || '/products'}><button className={s.btnLight}>{hp.ctaBanner.primaryButtonText}</button></Link>
              <Link href={hp.ctaBanner.secondaryButtonLink || '/contact'}><button className={s.btnGhostLight}>{hp.ctaBanner.secondaryButtonText}</button></Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
