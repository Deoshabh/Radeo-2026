'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';

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

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // Initial state setup to avoid flash of content
        let initialTranslateY = 0;
        let initialTranslateX = 0;

        switch (direction) {
            case 'up': initialTranslateY = distance; break;
            case 'down': initialTranslateY = -distance; break;
            case 'left': initialTranslateX = distance; break;
            case 'right': initialTranslateX = -distance; break;
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
                        duration: duration,
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
    }, [delay, direction, distance, duration, threshold]);

    return (
        <div ref={elementRef} className={className}>
            {children}
        </div>
    );
}
