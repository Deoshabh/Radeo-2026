'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';

export default function AnimatedEntry({ children, className = '', delay = 0 }) {
    const containerRef = useRef(null);

    useEffect(() => {
        // Animate children when component mounts
        anime({
            targets: containerRef.current.children,
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(100, { start: delay }),
            easing: 'easeOutExpo',
            duration: 800,
        });
    }, [delay]);

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    );
}
