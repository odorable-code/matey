/**
 * [파일 용도]
 * 선택한 기간 내의 감정 데이터 변화를 시각화하고, 
 * 평균 지표·최고점·추세(상승/하강) 등의 통계 정보를 요약해서 보여주는 리포트 컴포넌트입니다.
 */

import React, { useMemo } from 'react';
import styles from './EmotionChange.module.css';

function EmotionChange({
  title = '감정 변화 흐름',
  subtitle = '선택한 기간 안에서 감정 흐름이 어떻게 변했는지 한눈에 볼 수 있는 영역이에요.',
  items = [],
  className = '',
}) {
  const normalizedItems = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items.map((item, index) => ({
      key: item.key || item.label || `change-${index}`,
      label: item.label || `구간 ${index + 1}`,
      value: Math.max(0, Math.min(100, Number(item.value) || 0)),
    }));
  }, [items]);

  const stats = useMemo(() => {
    if (normalizedItems.length === 0) {
      return {
        average: 0,
        peak: null,
        trendText: '데이터 없음',
      };
    }

    const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);
    const average = Math.round(total / normalizedItems.length);

    const peak = normalizedItems.reduce((max, item) => {
      if (!max || item.value > max.value) return item;
      return max;
    }, null);

    const first = normalizedItems[0]?.value ?? 0;
    const last = normalizedItems[normalizedItems.length - 1]?.value ?? 0;
    const diff = last - first;

    let trendText = '유지 흐름';
    if (diff >= 6) trendText = '상승 흐름';
    if (diff <= -6) trendText = '하강 흐름';

    return {
      average,
      peak,
      trendText,
    };
  }, [normalizedItems]);

  const sectionClassName = [styles.section, className].filter(Boolean).join(' ');

  return (
    <section className={sectionClassName}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>EMOTION CHANGE</span>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>

        <p className={styles.sectionDescription}>{subtitle}</p>
      </div>

      <article className={styles.card}>
        <div className={styles.summaryRow}>
          <div className={styles.summaryChip}>
            <span className={styles.summaryChipLabel}>평균 지표</span>
            <strong className={styles.summaryChipValue}>{stats.average}</strong>
          </div>

          <div className={styles.summaryChip}>
            <span className={styles.summaryChipLabel}>최고 구간</span>
            <strong className={styles.summaryChipValue}>
              {stats.peak ? stats.peak.label : '-'}
            </strong>
          </div>

          <div className={styles.summaryChip}>
            <span className={styles.summaryChipLabel}>흐름 요약</span>
            <strong className={styles.summaryChipValue}>{stats.trendText}</strong>
          </div>
        </div>

        {normalizedItems.length > 0 ? (
          <div className={styles.changeList}>
            {normalizedItems.map((item) => (
              <div key={item.key} className={styles.changeItem}>
                <div className={styles.changeTop}>
                  <span className={styles.changeLabel}>{item.label}</span>
                  <strong className={styles.changeValue}>{item.value}</strong>
                </div>

                <div className={styles.changeTrack}>
                  <div
                    className={styles.changeFill}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            아직 표시할 감정 변화 데이터가 없어요.
          </div>
        )}
      </article>
    </section>
  );
}

export default EmotionChange;
