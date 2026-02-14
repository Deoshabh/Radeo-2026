'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';

export default function HeroAnimate({
    children,
    backgroundUrl,
    className = ''
}) {
    const containerRef = useRef(null);
    const bgRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        // Initial Reveal Animation
        const tl = anime.timeline({
            easing: 'easeOutExpo',
            duration: 1000
        });

        // Animate content elements (h1, p, button)
        // Assumes children are passed in a way that the content div wraps them
        const contentChildren = contentRef.current ? Array.from(contentRef.current.children) : [];

        if (contentChildren.length > 0) {
            tl.add({
                targets: contentChildren,
                translateY: [50, 0],
                opacity: [0, 1],
                delay: anime.stagger(150), // Stagger delay for each child
            });
        }
    }, []);

    // Parallax Effect
    useEffect(() => {
        const handleScroll = () => {
            if (!bgRef.current) return;
            const scrolled = window.scrollY;
            // Parallax: background moves at 40% speed of scroll
            // We use transform instead of background-position for better performance
            bgRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section ref={containerRef} className={`relative overflow-hidden ${className}`}>
            {/* Parallax Background Layer */}
            {backgroundUrl && (
                <div
                    ref={bgRef}
                    className="absolute inset-0 z-0 w-full h-[120%] -top-[10%] bg-cover bg-center pointer-events-none will-change-transform"
                    style={{ backgroundImage: `url(${backgroundUrl})` }}
                >
                    <div className="absolute inset-0 bg-black/40" />
                </div>
            )}

            {/* Content Layer */}
            <div ref={contentRef} className="relative z-10 h-full">
                {children}
            </div>
        </section>
    );
}
