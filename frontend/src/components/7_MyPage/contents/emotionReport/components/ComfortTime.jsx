/**
 * ComfortTime 컴포넌트
 * * 용도:
 * 1. 서비스('Matey') 내에서 사용자의 감정 데이터와 대화 패턴을 분석하여, 가장 심리적 안정감이 높았던 시간대를 시각적으로 보여주는 리포트 컴포넌트입니다.
 * 2. 특정 시간대(bestWindow)와 그에 대한 구체적인 분석 설명(description)을 제공하여 사용자가 자신의 정서적 리듬을 파악하도록 돕습니다.
 * 3. 해당 시간대에 나타난 주요 특징이나 긍정적인 신호들을 하이라이트 리스트(highlights) 형태로 정리하여 표시합니다.
 * 4. 감정 리포트 대시보드에서 대화의 질이 높았던 순간을 요약하여 사용자에게 정서적 피드백을 전달하는 역할을 합니다.
 */

import React, { useMemo } from 'react';
import styles from './ComfortTime.module.css';

function ComfortTime({
  title = '가장 편안했던 시간',
  subtitle = '메이티와의 대화가 가장 안정감 있고 위로가 높게 나타난 시간대를 보여주는 영역이에요.',
  bestWindow = '',
  description = '',
  highlights = [],
  className = '',
}) {
  const normalizedHighlights = useMemo(() => {
    if (!Array.isArray(highlights) || highlights.length === 0) {
      return [];
    }

    return highlights.filter(Boolean).slice(0, 4);
  }, [highlights]);

  const hasMainValue = Boolean(bestWindow);

  const sectionClassName = [styles.section, className].filter(Boolean).join(' ');

  return (
    <section className={sectionClassName}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>COMFORT TIME</span>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>

        <p className={styles.sectionDescription}>{subtitle}</p>
      </div>

      <article className={styles.card}>
        {hasMainValue ? (
          <>
            <span className={styles.mainLabel}>가장 편안했던 시간대</span>
            <strong className={styles.mainValue}>{bestWindow}</strong>

            {description ? (
              <p className={styles.mainDescription}>{description}</p>
            ) : null}

            {normalizedHighlights.length > 0 ? (
              <div className={styles.highlightList}>
                {normalizedHighlights.map((item, index) => (
                  <div key={`${item}-${index}`} className={styles.highlightItem}>
                    <span className={styles.highlightIndex}>{index + 1}</span>
                    <span className={styles.highlightText}>{item}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className={styles.emptyState}>
            아직 표시할 편안한 시간 데이터가 없어요.
          </div>
        )}
      </article>
    </section>
  );
}

export default ComfortTime;
