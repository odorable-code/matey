/**
 * CoreEmotion 컴포넌트
 * * 용도:
 * 1. 서비스('Matey'/'Huggy')의 감정 분석 리포트에서 사용자의 '핵심 감정' 상태를 시각화하여 요약해주는 컴포넌트입니다.
 * 2. 특정 기간 동안 가장 지배적이었던 감정(dominantEmotion)과 그에 대한 상세 설명을 상단에 강조하여 표시합니다.
 * 3. 전체적인 감정 분포(distribution)를 키워드 태그 형태의 프리뷰와 도넛 차트(EmotionDonut)를 통해 한눈에 비교할 수 있도록 제공합니다.
 * 4. 사용자가 자신의 주된 정서적 흐름과 비중을 직관적으로 파악할 수 있게 돕는 대시보드의 핵심 위젯 역할을 합니다.
 */

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
