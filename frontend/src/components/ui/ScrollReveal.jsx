'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function ScrollReveal({
    children,
    className = '',
    delay = 0,
    direction = 'up', // up, down, left, right
    distance = 30, // distance to move in px
    duration = 800,
    threshold = 0.2 // IntersectionObserver threshold
}) {
    const elementRef = useRef(null);
    const hasAnimated = useRef(false);
    const { settings } = useSiteSettings();

    const themeEffects = settings?.theme?.effects || {};
    const animationsEnabled = themeEffects.scrollAnimations !== false;
    const animationType = themeEffects.scrollAnimationType || 'fade-in';

    const effectiveDirection = direction === 'up'
        ? ({
            'fade-in': 'up',
            'slide-up': 'up',
            'scale-in': 'up',
            none: 'up',
        }[animationType] || 'up')
        : direction;

    const effectiveDistance = animationType === 'none' ? 0 : distance;
    const effectiveDuration = animationType === 'none' ? 0 : duration;

    useEffect(() => {
        if (!animationsEnabled) {
            const element = elementRef.current;
            if (element) {
                element.style.opacity = '1';
                element.style.transform = 'none';
            }
            return;
        }

        const element = elementRef.current;
        if (!element) return;

        // Initial state setup to avoid flash of content
        let initialTranslateY = 0;
        let initialTranslateX = 0;

        switch (effectiveDirection) {
            case 'up': initialTranslateY = effectiveDistance; break;
            case 'down': initialTranslateY = -effectiveDistance; break;
            case 'left': initialTranslateX = effectiveDistance; break;
            case 'right': initialTranslateX = -effectiveDistance; break;
        }

        // Apply initial styles immediately
        if (!hasAnimated.current) {
            element.style.opacity = '0';
            element.style.transform = `translate(${initialTranslateX}px, ${initialTranslateY}px)`;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;

                    anime({
                        targets: element,
                        opacity: [0, 1],
                        translateX: [initialTranslateX, 0],
                        translateY: [initialTranslateY, 0],
                        easing: 'easeOutCubic',
                        duration: effectiveDuration,
                        delay: delay
                    });

                    observer.unobserve(element);
                }
            },
            { threshold }
        );

        observer.observe(element);

        return () => {
            if (element) observer.unobserve(element);
        };
    }, [delay, effectiveDirection, effectiveDistance, effectiveDuration, threshold, animationsEnabled]);

    return (
        <div ref={elementRef} className={className}>
            {children}
        </div>
    );
}
