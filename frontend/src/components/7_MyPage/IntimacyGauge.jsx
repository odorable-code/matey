import React, { useMemo } from "react";
import styles from "./IntimacyGauge.module.css";

function IntimacyGauge({ level = 1, score = 0, nextLevelScore = 100 }) {
  const progress = useMemo(() => {
    if (!nextLevelScore) {
      return 0;
    }
    return Math.min((score / nextLevelScore) * 100, 100);
  }, [nextLevelScore, score]);

  const remainingScore = Math.max(nextLevelScore - score, 0);
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * progress) / 100;

  return (
    <div className={styles.wrapper}>
      <div className={styles.gaugeFrame}>
        <div className={styles.gaugeGlow} aria-hidden="true" />

        <svg
          className={styles.gaugeSvg}
          width="188"
          height="188"
          viewBox="0 0 188 188"
          role="img"
          aria-label={`친밀도 레벨 ${level}`}
        >
          <defs>
            <linearGradient id="mateyBotGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6CA6FF" />
              <stop offset="52%" stopColor="#8D79FF" />
              <stop offset="100%" stopColor="#FF92BA" />
            </linearGradient>
          </defs>

          <circle className={styles.track} cx="94" cy="94" r={radius} />
          <circle
            className={styles.progress}
            cx="94"
            cy="94"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>

        <div className={styles.centerLabel}>
          <span className={styles.levelCaption}>친밀도</span>
          <strong className={styles.levelValue}>Lv.{level}</strong>
          <span className={styles.percentBadge}>{Math.round(progress)}%</span>
        </div>
      </div>

      <div className={styles.metaInfo}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>현재 점수</span>
          <strong className={styles.metaValue}>{score}점</strong>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>다음 레벨까지</span>
          <strong className={styles.metaValue}>{remainingScore}점</strong>
        </div>
      </div>
    </div>
  );
}

export default IntimacyGauge;
