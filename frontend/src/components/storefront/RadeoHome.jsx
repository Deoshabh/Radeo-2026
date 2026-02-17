'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import anime from 'animejs';
import IMAGES from '@/config/radeoImages';
import s from './RadeoHome.module.css';

/* ── Image helper with fallback ── */
function useFallbackSrc(src) {
  const [imgSrc, setImgSrc] = useState(src);
  const onError = useCallback(() => {
    setImgSrc(IMAGES.fallback);
  }, []);
  return { src: imgSrc, onError };
}

function RImg({ src, alt, className, id, width, height, loading, style }) {
  const fb = useFallbackSrc(src);
  return (
    <img
      id={id}
      src={fb.src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      style={style}
      onError={fb.onError}
    />
  );
}

/* ── Testimonial data ── */
const TESTIMONIALS = [
  {
    text: '"The Langham Oxford is, without exaggeration, the finest shoe I have worn. The leather develops a patina that tells your story. Exceptional."',
    author: '— Arjun Mehta, Mumbai',
  },
  {
    text: '"I\'ve worn bespoke from London and Florence. RADEO stands shoulder to shoulder with the best — at a fraction of the price. Truly remarkable craftsmanship."',
    author: '— Vikram Singh, New Delhi',
  },
  {
    text: '"Every detail speaks of care. From the unboxing ritual to the first step on pavement — this is what luxury should feel like. My fourth pair."',
    author: '— Priya Sharma, Bangalore',
  },
];

/* ── Craft features data ── */
const CRAFT_FEATURES = [
  { num: '01', name: 'Goodyear Welt', desc: 'A 200-year-old construction method that lets the sole be replaced — extending every pair\'s life by decades.' },
  { num: '02', name: 'Hand-Burnished', desc: 'Each shoe is burnished by hand, giving the leather a rich, luminous patina unique to its wearer.' },
  { num: '03', name: 'Cork Insole', desc: 'A natural cork footbed moulds to your foot over time, providing bespoke comfort with every step.' },
  { num: '04', name: 'Full-Grain', desc: 'Only the finest full-grain hides are selected — sourced from heritage tanneries across three continents.' },
];

/* ════════════════════════════════════════════════
   RADEO HOME COMPONENT
   ════════════════════════════════════════════════ */

export default function RadeoHome() {
  const rootRef = useRef(null);
  const preloaderRef = useRef(null);
  const preloaderBarRef = useRef(null);
  const preloaderCounterRef = useRef(null);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const hasAnimated = useRef(false);

  /* ── Preloader ── */
  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const counter = { val: 0 };
    const counterEl = preloaderCounterRef.current;

    const tl = anime.timeline({ easing: 'easeOutExpo' });

    tl.add({
      targets: `.${s.preloaderLetter}`,
      translateY: ['110%', '0%'],
      duration: 700,
      delay: anime.stagger(80),
    });

    tl.add({
      targets: preloaderBarRef.current,
      width: ['0%', '100%'],
      duration: 1600,
      easing: 'easeInOutQuart',
    }, '-=400');

    tl.add({
      targets: counter,
      val: [0, 100],
      round: 1,
      duration: 1600,
      easing: 'easeInOutQuart',
      update: () => {
        if (counterEl) counterEl.textContent = String(Math.floor(counter.val)).padStart(3, '0');
      },
    }, '-=1600');

    tl.add({
      targets: `.${s.preloaderLetter}`,
      translateY: ['0%', '-110%'],
      duration: 500,
      delay: anime.stagger(50),
      easing: 'easeInExpo',
    });

    tl.add({
      targets: [preloaderBarRef.current, preloaderCounterRef.current],
      opacity: 0,
      duration: 300,
    }, '-=300');

    tl.add({
      targets: preloaderRef.current,
      translateY: '-100%',
      duration: 800,
      easing: 'easeInOutExpo',
      complete: () => {
        setPreloaderDone(true);
        runHeroEntrance();
      },
    });
  }, []);

  /* ── Hero entrance ── */
  function runHeroEntrance() {
    const tl = anime.timeline({ easing: 'easeOutExpo' });

    // Eyebrow
    tl.add({
      targets: `.${s.heroEyebrow}`,
      opacity: [0, 1],
      translateX: [20, 0],
      duration: 600,
    });

    // Title lines
    tl.add({
      targets: `.${s.heroTitleLine} span`,
      translateY: ['110%', '0%'],
      duration: 900,
      delay: anime.stagger(130),
    }, '-=400');

    // Description
    tl.add({
      targets: `.${s.heroDesc}`,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 700,
    }, '-=500');

    // CTA buttons
    tl.add({
      targets: [`.${s.btnPrimary}`, `.${s.btnGhost}`],
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 600,
      delay: anime.stagger(100),
    }, '-=400');

    // Stats
    tl.add({
      targets: `.${s.heroStats}`,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
    }, '-=400');

    // Hero image
    tl.add({
      targets: `.${s.heroImg}`,
      scale: [1.08, 1.0],
      opacity: [0, 1],
      duration: 1200,
      easing: 'easeOutQuad',
    }, '-=800');

    // Stat counters
    tl.add({
      duration: 1,
      complete: () => {
        document.querySelectorAll(`.${s.heroStatNum}`).forEach((el) => {
          const target = parseInt(el.getAttribute('data-target'), 10);
          const obj = { val: 0 };
          anime({
            targets: obj,
            val: target,
            round: 1,
            duration: 2000,
            easing: 'easeOutExpo',
            update: () => { el.textContent = Math.floor(obj.val); },
          });
        });
      },
    });
  }

  /* ── Scroll Reveals ── */
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        const delay = parseInt(el.getAttribute('data-delay') || '0', 10);

        if (el.classList.contains(s.revealLabel)) {
          anime({ targets: el, opacity: [0, 1], translateY: [16, 0], duration: 600, easing: 'easeOutExpo' });
        }
        if (el.classList.contains(s.revealHead)) {
          anime({ targets: el, opacity: [0, 1], duration: 100 });
          anime({ targets: el.querySelectorAll(`.${s.sectionHead} .rhLine span, .rhLine span`), translateY: ['110%', '0%'], duration: 800, delay: anime.stagger(100), easing: 'easeOutExpo' });
        }
        if (el.classList.contains(s.revealCard)) {
          anime({ targets: el, opacity: [0, 1], translateY: [36, 0], duration: 800, easing: 'easeOutExpo', delay });
        }
        if (el.classList.contains(s.revealImg)) {
          anime({ targets: el, opacity: [0, 1], duration: 100 });
          const img = el.querySelector('img');
          if (img) anime({ targets: img, scale: [1.06, 1.0], opacity: [0, 1], duration: 1000, easing: 'easeOutExpo', delay });
        }
        if (el.classList.contains(s.revealSplitL)) {
          anime({ targets: el, opacity: [0, 1], translateX: [-40, 0], duration: 800, easing: 'easeOutExpo' });
        }
        if (el.classList.contains(s.revealSplitR)) {
          anime({ targets: el, opacity: [0, 1], translateX: [40, 0], duration: 800, easing: 'easeOutExpo' });
        }
        if (el.classList.contains(s.revealFeature)) {
          anime({ targets: el, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: 'easeOutExpo', delay });
        }
        if (el.classList.contains(s.revealQuote)) {
          anime({ targets: el, opacity: [0, 1], translateY: [24, 0], duration: 900, easing: 'easeOutExpo' });
        }
      });
    }, { threshold: 0.15 });

    // Observe after a tick so DOM is ready
    const timer = setTimeout(() => {
      const root = rootRef.current;
      if (!root) return;
      const selectors = [s.revealLabel, s.revealHead, s.revealCard, s.revealImg, s.revealSplitL, s.revealSplitR, s.revealFeature, s.revealQuote]
        .map((c) => `.${c}`).join(', ');
      root.querySelectorAll(selectors).forEach((el) => {
        // Skip hero children
        if (el.closest(`.${s.hero}`)) return;
        observer.observe(el);
      });
    }, 100);

    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  /* ── Parallax ── */
  useEffect(() => {
    const heroImg = rootRef.current?.querySelector(`.${s.heroImg}`);
    const heroContent = rootRef.current?.querySelector(`.${s.heroContent}`);

    function onScroll() {
      const sy = window.scrollY;
      if (sy < window.innerHeight * 1.5) {
        if (heroImg) heroImg.style.transform = `translateY(${sy * 0.18}px)`;
        if (heroContent) heroContent.style.transform = `translateY(${sy * 0.06}px)`;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── 3D Tilt on product cards ── */
  useEffect(() => {
    const cards = rootRef.current?.querySelectorAll(`.${s.productCard}`);
    if (!cards) return;

    const handlers = [];
    cards.forEach((card) => {
      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${y * -12}deg) rotateY(${x * 12}deg)`;
      };
      const onLeave = () => {
        anime({ targets: card, rotateX: 0, rotateY: 0, duration: 600, easing: 'easeOutElastic(1, 0.5)' });
        card.style.transform = '';
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      handlers.push({ card, onMove, onLeave });
    });

    return () => {
      handlers.forEach(({ card, onMove, onLeave }) => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  /* ── Magnetic buttons ── */
  useEffect(() => {
    const btns = rootRef.current?.querySelectorAll(`.${s.btnPrimary}, .${s.btnLight}`);
    if (!btns) return;

    const handlers = [];
    btns.forEach((btn) => {
      const onMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        btn.style.transform = `translate(${(e.clientX - cx) * 0.28}px, ${(e.clientY - cy) * 0.28}px)`;
      };
      const onLeave = () => {
        anime({ targets: btn, translateX: 0, translateY: 0, duration: 800, easing: 'easeOutElastic(1, 0.5)' });
      };
      btn.addEventListener('mousemove', onMove);
      btn.addEventListener('mouseleave', onLeave);
      handlers.push({ btn, onMove, onLeave });
    });

    return () => {
      handlers.forEach(({ btn, onMove, onLeave }) => {
        btn.removeEventListener('mousemove', onMove);
        btn.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  /* ── Add to cart micro-interaction ── */
  function handleAddToCart(e) {
    const btn = e.currentTarget;
    anime({
      targets: btn,
      scale: [1, 0.82, 1.25, 1],
      duration: 500,
      easing: 'easeOutElastic(1, 0.5)',
    });
    const orig = btn.textContent;
    btn.textContent = '✓';
    btn.style.background = 'var(--r-bronze)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 1800);
  }

  /* ── Testimonial carousel ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  function goTestimonial(idx) {
    if (idx !== testimonialIdx) setTestimonialIdx(idx);
  }

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className={s.radeoRoot} ref={rootRef}>

      {/* ═══ PRELOADER ═══ */}
      <div
        className={`${s.preloader} ${preloaderDone ? s.preloaderHidden : ''}`}
        ref={preloaderRef}
      >
        <div className={s.preloaderWord}>
          {'RADEO'.split('').map((ch, i) => (
            <span key={i} className={s.preloaderLetter}>{ch}</span>
          ))}
        </div>
        <div className={s.preloaderBarWrap}>
          <div className={s.preloaderBar} ref={preloaderBarRef}></div>
        </div>
        <div className={s.preloaderCounter} ref={preloaderCounterRef}>000</div>
      </div>

      {/* ═══ HERO ═══ */}
      <section className={s.hero}>
        <div className={s.heroImgCol}>
          <RImg
            id="img-hero-main"
            src={IMAGES.hero.main}
            alt="RADEO signature Oxford shoe editorial"
            className={s.heroImg}
            width={1200}
            height={1600}
          />
          <div className={s.heroImgOverlay}></div>
        </div>
        <div className={s.heroContent}>
          <div className={s.heroEyebrow}>Est. 2008 — Handcrafted Luxury</div>
          <h1 className={s.heroTitle}>
            <span className={s.heroTitleLine}><span>Where Craft</span></span>
            <span className={s.heroTitleLine}><span className={s.heroTitleItalic}>Becomes</span></span>
            <span className={s.heroTitleLine}><span>Legacy</span></span>
          </h1>
          <p className={s.heroDesc}>
            Each pair is shaped by sixteen years of mastery — hand-lasted, hand-stitched, and finished to an heirloom standard that only improves with age.
          </p>
          <div className={s.heroCtas}>
            <Link href="/products">
              <button className={s.btnPrimary}>Explore Collection</button>
            </Link>
            <Link href="#craft">
              <button className={s.btnGhost}>Our Process <span>→</span></button>
            </Link>
          </div>
          <div className={s.heroStats}>
            <div className={s.heroStat}>
              <span className={s.heroStatNum} data-target="16">0</span>+ Years
            </div>
            <div className={s.heroStat}>
              <span className={s.heroStatNum} data-target="48">0</span>K+ Pairs
            </div>
            <div className={s.heroStat}>
              <span className={s.heroStatNum} data-target="12">0</span> Artisans
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className={s.marquee}>
        <div className={s.marqueeInner}>
          <span className={s.marqueeText}>Full-Grain Leather&ensp;◆&ensp;Goodyear Welt&ensp;◆&ensp;Hand-Burnished&ensp;◆&ensp;Free Shipping in India&ensp;◆&ensp;Lifetime Resoling&ensp;◆&ensp;Cork Footbed&ensp;◆&ensp;Bespoke Available</span>
          <span className={s.marqueeText}>Full-Grain Leather&ensp;◆&ensp;Goodyear Welt&ensp;◆&ensp;Hand-Burnished&ensp;◆&ensp;Free Shipping in India&ensp;◆&ensp;Lifetime Resoling&ensp;◆&ensp;Cork Footbed&ensp;◆&ensp;Bespoke Available</span>
        </div>
      </div>

      {/* ═══ COLLECTION ═══ */}
      <section className={`${s.section} ${s.collectionBg}`} id="collection">
        <div className={s.container}>
          <div className={`${s.sectionLabel} ${s.revealLabel}`}>Curated Selection</div>
          <h2 className={`${s.sectionHead} ${s.revealHead}`}>
            <span className="rhLine"><span>The Collection</span></span>
          </h2>
          <div className={s.productsGrid}>
            {IMAGES.products.map((p, i) => (
              <div
                key={p.id}
                className={`${s.productCard} ${s.revealCard}`}
                data-delay={i * 80}
              >
                <div className={s.cardImgWrap}>
                  <RImg
                    id={`img-product-${p.id}`}
                    src={p.image}
                    alt={p.name}
                    className={s.cardImgMain}
                    width={800}
                    height={1000}
                    loading="lazy"
                  />
                  <RImg
                    id={`img-product-${p.id}-hover`}
                    src={p.hover}
                    alt={`${p.name} alternate view`}
                    className={s.cardImgHover}
                    width={800}
                    height={1000}
                    loading="lazy"
                  />
                </div>
                <div className={s.cardInfo}>
                  <span className={s.cardTag}>{p.tag}</span>
                  <h3 className={s.cardName}>{p.name}</h3>
                  <div className={s.cardFooter}>
                    <span className={s.cardPrice}>{p.price}</span>
                    <button
                      className={s.cardAdd}
                      aria-label="Add to cart"
                      onClick={handleAddToCart}
                    >+</button>
                  </div>
                </div>
                <span className={s.cardBadge}>New</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CRAFT ═══ */}
      <section className={`${s.section} ${s.craftBg}`} id="craft">
        <div className={s.container}>
          <div className={`${s.sectionLabel} ${s.revealLabel}`}>Our Process</div>
          <h2 className={`${s.sectionHead} ${s.revealHead}`}>
            <span className="rhLine"><span>The Art of</span></span>
            <span className="rhLine"><span>Shoemaking</span></span>
          </h2>
          <div className={s.craftGrid}>
            {Object.entries(IMAGES.craft).map(([key, src], i) => (
              <div
                key={key}
                className={`${s.craftImgWrap} ${s.revealImg}`}
                data-delay={i * 120}
              >
                <RImg
                  id={`img-craft-${key}`}
                  src={src}
                  alt={`Craft process: ${key}`}
                  width={1200}
                  height={800}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <div className={s.craftFeatures}>
            {CRAFT_FEATURES.map((f, i) => (
              <div
                key={f.num}
                className={`${s.craftFeature} ${s.revealFeature}`}
                data-delay={i * 80}
              >
                <div className={s.craftFeatureNum}>{f.num}</div>
                <div className={s.craftFeatureName}>{f.name}</div>
                <p className={s.craftFeatureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MATERIALS ═══ */}
      <section className={`${s.section} ${s.materialsBg}`} id="materials">
        <div className={`${s.container} ${s.sectionHeadCenter}`}>
          <div className={`${s.sectionLabel} ${s.revealLabel}`}>World-Class Leathers</div>
          <h2 className={`${s.sectionHead} ${s.revealHead}`}>
            <span className="rhLine"><span>Our Materials</span></span>
          </h2>
          <div className={s.materialsGrid}>
            {IMAGES.materials.map((m, i) => (
              <div
                key={i}
                className={`${s.materialCard} ${s.revealCard}`}
                data-delay={i * 80}
              >
                <div className={s.matImgWrap}>
                  <RImg
                    id={`img-material-${i}`}
                    src={m.image}
                    alt={`${m.name} leather texture`}
                    className={s.matImg}
                    width={900}
                    height={1100}
                    loading="lazy"
                  />
                  <div className={s.matOverlay}></div>
                </div>
                <div className={s.matContent}>
                  <h3 className={s.matName}>{m.name}</h3>
                  <p className={s.matOrigin}>{m.origin}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STORY ═══ */}
      <section className={`${s.section} ${s.storyBg}`} id="about">
        <div className={s.container}>
          <div className={s.storyGrid}>
            <div className={`${s.storyImgWrap} ${s.revealSplitL}`}>
              <RImg
                id="img-lifestyle-about"
                src={IMAGES.lifestyle.about}
                alt="RADEO founder in the atelier"
                width={1200}
                height={900}
                loading="lazy"
              />
            </div>
            <div className={`${s.storyContent} ${s.revealSplitR}`}>
              <div className={s.sectionLabel}>Our Story</div>
              <h2 className={s.sectionHead}>
                <span className="rhLine"><span>Born From</span></span>
                <span className="rhLine"><span>Passion</span></span>
              </h2>
              <p className={s.storyBody}>
                Founded in 2008, RADEO started as a small atelier in Agra with a singular vision — to create leather shoes that rival the finest European makers, rooted in Indian craftsmanship.
              </p>
              <p className={s.storyBody}>
                Today, our twelve artisans continue that tradition. Every pair passes through over 200 hand operations before it earns the RADEO name.
              </p>
              <blockquote className={s.storyQuote}>
                &ldquo;A great shoe isn&rsquo;t made — it&rsquo;s born. Every cut, every stitch, every burnish is a conversation between the artisan and the leather.&rdquo;
              </blockquote>
              <Link href="/about" className={s.storyCta}>
                Our Story <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className={`${s.section} ${s.testimonialsBg}`}>
        <div className={s.container}>
          <div className={`${s.testimonialWrap} ${s.revealQuote}`}>
            <div className={s.testimonialStars}>★★★★★</div>
            <p className={s.testimonialQuote}>{TESTIMONIALS[testimonialIdx].text}</p>
            <p className={s.testimonialAuthor}>{TESTIMONIALS[testimonialIdx].author}</p>
            <div className={s.testimonialNav}>
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  className={`${s.testimonialDot} ${i === testimonialIdx ? s.testimonialDotActive : ''}`}
                  onClick={() => goTestimonial(i)}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className={`${s.section} ${s.ctaBanner}`}>
        <div className={s.ctaGrain}></div>
        <div className={s.container}>
          <h2 className={`${s.ctaBannerHead} ${s.revealHead}`}>
            <span className="rhLine"><span>Step Into</span></span>
            <span className="rhLine"><span><em>Legacy</em></span></span>
          </h2>
          <p className={`${s.ctaBannerSub} ${s.revealLabel}`}>
            Handcrafted to order. Delivered to your door. Free shipping across India.
          </p>
          <div className={s.ctaBannerBtns}>
            <Link href="/products">
              <button className={s.btnLight}>Shop Collection</button>
            </Link>
            <Link href="/contact">
              <button className={s.btnGhostLight}>Book an Appointment</button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
