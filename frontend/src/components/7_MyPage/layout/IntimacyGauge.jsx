import { useMemo } from 'react';
import styles from './IntimacyGauge.module.css';
import useAnimatedNumber, { usePrefersReducedMotion } from '../hooks/useAnimatedNumber';

export default function IntimacyGauge({
  level = 4,
  currentExp = 18,
  maxExp = 100,
  className = '',
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const animatedLevel = useAnimatedNumber(level, 900, prefersReducedMotion);
  const animatedCurrentExp = useAnimatedNumber(currentExp, 1100, prefersReducedMotion);

  const animatedPercent = useMemo(() => {
    if (!maxExp || maxExp <= 0) return 0;
    return Math.min(100, Math.max(0, (animatedCurrentExp / maxExp) * 100));
  }, [animatedCurrentExp, maxExp]);

  return (
    <section className={`${styles.card} ${className}`.trim()} aria-label="친밀도 카드">
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <p className={styles.eyebrow}>친밀도 LEVEL</p>
          <strong className={styles.level}>Lv. {animatedLevel}</strong>
        </div>

        <div className={styles.expWrap}>
          <span className={styles.expCurrent}>{animatedCurrentExp}</span>
          <span className={styles.expDivider}>/</span>
          <span className={styles.expMax}>{maxExp}</span>
        </div>
      </div>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="친밀도 경험치"
        aria-valuemin={0}
        aria-valuemax={maxExp}
        aria-valuenow={Math.min(animatedCurrentExp, maxExp)}
      >
        <div
          className={styles.progressFill}
          style={{ width: `${animatedPercent}%` }}
        />
      </div>
    </section>
  );
}
