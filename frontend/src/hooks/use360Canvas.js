import { useRef, useEffect, useCallback } from 'react';

/**
 * Shared canvas rendering hook for 360 viewers.
 * Handles contain-scaling, DPR-aware resizing, and drawing the current frame.
 *
 * @param {object} options
 * @param {string} options.currentImageSrc - URL of the current frame image
 * @param {boolean} [options.responsive=false] - If true, auto-resize canvas to container via ResizeObserver
 * @param {number} [options.fixedWidth] - Fixed canvas pixel width (used when responsive=false)
 * @param {number} [options.fixedHeight] - Fixed canvas pixel height (used when responsive=false)
 * @returns {{ canvasRef: React.RefObject, containerRef: React.RefObject }}
 */
export function use360Canvas({
  currentImageSrc,
  responsive = false,
  fixedWidth = 800,
  fixedHeight = 800,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Draw image with contain-scaling
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentImageSrc) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };

    img.src = currentImageSrc;
  }, [currentImageSrc]);

  // Responsive resize observer (DPR-aware)
  useEffect(() => {
    if (!responsive) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      draw();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [responsive, draw]);

  // Redraw when currentImageSrc changes
  useEffect(() => {
    draw();
  }, [draw]);

  return { canvasRef, containerRef };
}
