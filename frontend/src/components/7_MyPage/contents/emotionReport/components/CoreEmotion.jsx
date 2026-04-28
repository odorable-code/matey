import React, { useMemo } from 'react';
import styles from './CoreEmotion.module.css';
import EmotionDonut from './EmotionDonut';

function CoreEmotion({
  title = '핵심 감정',
  subtitle = '현재 기간에서 가장 중심이 되는 감정과 감정 분포를 함께 보여주는 영역이에요.',
  dominantEmotion = null,
  distribution = [],
  donutTitle = '감정 분포',
  donutSubtitle = '선택한 기간 기준 감정 비율',
  totalLabel = '전체 감정',
  centerValue = '',
  centerUnit = '',
  className = '',
}) {
  const resolvedDominant = useMemo(() => {
    if (
      dominantEmotion &&
      typeof dominantEmotion === 'object' &&
      dominantEmotion.label
    ) {
      return {
        label: dominantEmotion.label,
        value: Number(dominantEmotion.value) || 0,
        description:
          dominantEmotion.description ||
          '현재 기간에서 가장 자주 등장한 핵심 감정이에요.',
      };
    }

    return {
      label: '데이터 없음',
      value: 0,
      description: '아직 표시할 핵심 감정 데이터가 없어요.',
    };
  }, [dominantEmotion]);

  const keywordPreview = useMemo(() => {
    if (!Array.isArray(distribution) || distribution.length === 0) {
      return [];
    }

    return distribution
      .filter((item) => Number(item.value) > 0)
      .slice(0, 3)
      .map((item) => ({
        key: item.key || item.label,
        label: item.label,
        value: Number(item.value) || 0,
      }));
  }, [distribution]);

  const sectionClassName = [styles.section, className].filter(Boolean).join(' ');

  return (
    <section className={sectionClassName}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>CORE EMOTION</span>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>

        <p className={styles.sectionDescription}>{subtitle}</p>
      </div>

      <div className={styles.contentGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>가장 두드러진 감정</span>

          <strong className={styles.summaryValue}>
            {resolvedDominant.label}
            <span className={styles.summaryValueUnit}>
              {' '}
              · {resolvedDominant.value}%
            </span>
          </strong>

          <p className={styles.summaryDescription}>
            {resolvedDominant.description}
          </p>

          {keywordPreview.length > 0 ? (
            <div className={styles.keywordGroup}>
              {keywordPreview.map((item) => (
                <span key={item.key} className={styles.keywordTag}>
                  {item.label} {item.value}%
                </span>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              아직 표시할 감정 비율 데이터가 없어요.
            </div>
          )}
        </article>

        <EmotionDonut
          title={donutTitle}
          subtitle={donutSubtitle}
          items={distribution}
          totalLabel={totalLabel}
          centerValue={centerValue}
          centerUnit={centerUnit}
        />
      </div>
    </section>
  );
}

export default CoreEmotion;
