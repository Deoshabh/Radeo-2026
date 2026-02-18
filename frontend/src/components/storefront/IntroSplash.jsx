'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import anime from 'animejs';
import s from './IntroSplash.module.css';

const SESSION_KEY = 'radeo_intro_seen';

/**
 * IntroSplash — Route-aware first-visit gate.
 * Shows a dark overlay with RADEO wordmark, gold progress bar,
 * and counter on the user's first visit per browser session.
 * Controlled via sessionStorage so it never replays mid-session.
 *
 * @param {Object} props
 * @param {Function} props.onComplete — called after exit animation finishes
 */
export default function IntroSplash({ onComplete }) {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const overlayRef = useRef(null);
  const barRef = useRef(null);
  const counterRef = useRef(null);
  const hasRun = useRef(false);

  /* ── Gate: only show on first visit this session ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      setDone(true);
      onComplete?.();
      return;
    }
    setVisible(true);
  }, [onComplete]);

  /* ── Animation timeline ── */
  useEffect(() => {
    if (!visible || hasRun.current) return;
    hasRun.current = true;

    const counter = { val: 0 };
    const counterEl = counterRef.current;
    const exit_ease = 'cubicBezier(0.76, 0, 0.24, 1)';

    const tl = anime.timeline({ easing: 'easeOutExpo' });

    /* Letters rise in */
    tl.add({
      targets: `.${s.splashLetter}`,
      translateY: ['120%', '0%'],
      duration: 700,
      delay: anime.stagger(80),
    });

    /* Gold bar grows center-out */
    tl.add({
      targets: barRef.current,
      width: ['0px', '80px'],
      duration: 600,
      easing: 'easeOutCubic',
    }, '-=300');

    /* Counter counts up */
    tl.add({
      targets: counter,
      val: [0, 100],
      round: 1,
      duration: 1400,
      easing: 'easeInOutQuart',
      update: () => {
        if (counterEl) counterEl.textContent = String(Math.floor(counter.val)).padStart(3, '0');
      },
    }, '-=600');

    /* Bar completes */
    tl.add({
      targets: barRef.current,
      width: '100%',
      duration: 400,
      easing: 'easeInOutQuart',
    }, '-=400');

    /* Brief hold, then letters slide up */
    tl.add({
      targets: `.${s.splashLetter}`,
      translateY: ['0%', '-120%'],
      duration: 500,
      delay: anime.stagger(50),
      easing: 'easeInExpo',
    }, '+=200');

    /* Fade counter and bar */
    tl.add({
      targets: [barRef.current, counterRef.current],
      opacity: 0,
      duration: 300,
    }, '-=300');

    /* Overlay slides up */
    tl.add({
      targets: overlayRef.current,
      translateY: '-100%',
      duration: 800,
      easing: exit_ease,
      complete: () => {
        sessionStorage.setItem(SESSION_KEY, '1');
        setDone(true);
        onComplete?.();
      },
    });
  }, [visible, onComplete]);

  /* Don't render anything once done or if already seen */
  if (done) return null;
  if (!visible) return null;

  return (
    <div
      className={s.splashOverlay}
      ref={overlayRef}
      aria-hidden="true"
    >
      <div className={s.splashGrain} />

      <div className={s.splashWord}>
        {'RADEO'.split('').map((ch, i) => (
          <span key={i} className={s.splashLetter}>{ch}</span>
        ))}
      </div>

      <div className={s.splashBarWrap}>
        <div className={s.splashBar} ref={barRef} />
      </div>

      <div className={s.splashCounter} ref={counterRef}>000</div>
    </div>
  );
}
