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
