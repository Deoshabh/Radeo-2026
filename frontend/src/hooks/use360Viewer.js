
import { useState, useRef, useCallback, useEffect } from 'react';
import anime from 'animejs';

export function use360Viewer({ images, sensitivity = 3, autoRotate = false }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartX = useRef(null);
  const lastX = useRef(null);
  const velocityRef = useRef(0);
  const momentumRafRef = useRef(null);
  const autoRotateAnimRef = useRef(null);
  const accumulatedDeltaRef = useRef(0);

  const frameCount = images?.length || 0;

  const clampFrame = useCallback(
    (value) => {
      if (frameCount === 0) return 0;
      return ((value % frameCount) + frameCount) % frameCount;
    },
    [frameCount],
  );

  const stopAutoRotate = useCallback(() => {
    if (autoRotateAnimRef.current) {
      autoRotateAnimRef.current.pause();
      autoRotateAnimRef.current = null;
    }
  }, []);

  const startAutoRotate = useCallback(
    (rpm = 2) => {
      if (frameCount < 2 || autoRotateAnimRef.current) return;

      const msPerRotation = 60000 / Math.max(rpm, 0.1);
      const proxy = { frame: currentFrame };

      autoRotateAnimRef.current = anime({
        targets: proxy,
        frame: currentFrame + frameCount,
        duration: msPerRotation,
        easing: 'linear',
        loop: true,
        update: () => {
          setCurrentFrame(clampFrame(Math.floor(proxy.frame)));
        },
      });
    },
    [frameCount, currentFrame, clampFrame],
  );

  const clearMomentum = useCallback(() => {
    if (momentumRafRef.current) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
  }, []);

  const handleDragStart = useCallback(
    (clientX) => {
      if (frameCount === 0) return;
      setIsDragging(true);
      dragStartX.current = clientX;
      lastX.current = clientX;
      velocityRef.current = 0;
      accumulatedDeltaRef.current = 0;
      clearMomentum();
      stopAutoRotate();
    },
    [frameCount, clearMomentum, stopAutoRotate],
  );

  const handleDragMove = useCallback(
    (clientX) => {
      if (!isDragging || dragStartX.current === null || frameCount === 0) return;

      const deltaX = clientX - (lastX.current ?? clientX);
      lastX.current = clientX;
      velocityRef.current = deltaX;
      accumulatedDeltaRef.current += deltaX;

      if (Math.abs(accumulatedDeltaRef.current) >= sensitivity) {
        const step = Math.floor(Math.abs(accumulatedDeltaRef.current) / sensitivity);
        const direction = accumulatedDeltaRef.current > 0 ? -1 : 1;

        setCurrentFrame((prev) => clampFrame(prev + step * direction));
        accumulatedDeltaRef.current = accumulatedDeltaRef.current % sensitivity;
      }
    },
    [isDragging, frameCount, sensitivity, clampFrame],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartX.current = null;

    let velocity = velocityRef.current;

    if (Math.abs(velocity) > 0.5) {
      const decay = () => {
        velocity *= 0.92;
        if (Math.abs(velocity) < 0.1) {
          momentumRafRef.current = null;
          return;
        }
        setCurrentFrame((prev) => clampFrame(prev + (velocity > 0 ? -1 : 1)));
        momentumRafRef.current = requestAnimationFrame(decay);
      };
      momentumRafRef.current = requestAnimationFrame(decay);
    }
  }, [isDragging, clampFrame]);

  useEffect(() => {
    if (!isDragging && autoRotate) {
      startAutoRotate();
    }
    if (!autoRotate) {
      stopAutoRotate();
    }
  }, [autoRotate, isDragging, startAutoRotate, stopAutoRotate]);

  useEffect(() => {
    setCurrentFrame((prev) => clampFrame(prev));
  }, [frameCount, clampFrame]);

  useEffect(() => {
    return () => {
      clearMomentum();
      stopAutoRotate();
    };
  }, [clearMomentum, stopAutoRotate]);

  return {
    currentFrame,
    isDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    startAutoRotate,
    stopAutoRotate,
    currentImageSrc: images?.[currentFrame] || '',
  };
}
