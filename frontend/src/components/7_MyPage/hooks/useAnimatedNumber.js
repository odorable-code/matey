import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  return prefersReducedMotion;
}

export default function useAnimatedNumber(
  targetValue,
  duration = 1000,
  options = {}
) {
  const { reducedMotion = false, decimals = 0 } = options;

  const [animatedValue, setAnimatedValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const safeTarget = Number.isFinite(Number(targetValue))
      ? Number(targetValue)
      : 0;

    if (reducedMotion) {
      setAnimatedValue(safeTarget);
      return undefined;
    }

    const startValue = 0;
    const startTime = performance.now();

    setAnimatedValue(startValue);

    const updateValue = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const nextValue = startValue + (safeTarget - startValue) * eased;
      const fixedValue =
        decimals > 0 ? Number(nextValue.toFixed(decimals)) : Math.round(nextValue);

      setAnimatedValue(fixedValue);

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(updateValue);
      } else {
        setAnimatedValue(
          decimals > 0 ? Number(safeTarget.toFixed(decimals)) : Math.round(safeTarget)
        );
      }
    };

    frameRef.current = window.requestAnimationFrame(updateValue);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [targetValue, duration, reducedMotion, decimals]);

  return animatedValue;
}
