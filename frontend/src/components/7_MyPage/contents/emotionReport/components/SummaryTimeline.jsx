import React, { useMemo } from 'react';
import styles from './SummaryTimeline.module.css';

function SummaryTimeline({
  title = '요약 타임라인',
  subtitle = '기간 내 대화 흐름을 시간 순서대로 요약해서 보여주는 영역이에요.',
  items = [],
  emptyText = '아직 표시할 타임라인 데이터가 없어요.',
  className = '',
}) {
  const normalizedItems = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items
      .filter(Boolean)
      .map((item, index) => {
        if (typeof item === 'string') {
          return {
            key: `timeline-${index}`,
            label: `핵심 흐름 ${index + 1}`,
            description: item,
            meta: '',
          };
        }

        return {
          key: item.key || `timeline-${index}`,
          label: item.label || `핵심 흐름 ${index + 1}`,
          description: item.description || '',
          meta: item.meta || '',
        };
      });
  }, [items]);

  const sectionClassName = [styles.section, className].filter(Boolean).join(' ');

  return (
    <section className={sectionClassName}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>SUMMARY TIMELINE</span>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>

        <p className={styles.sectionDescription}>{subtitle}</p>
      </div>

      <article className={styles.card}>
        {normalizedItems.length > 0 ? (
          <div className={styles.timelineList}>
            {normalizedItems.map((item, index) => (
              <div key={item.key} className={styles.timelineItem}>
                <div className={styles.timelineIndex}>{index + 1}</div>

                <div className={styles.timelineCopy}>
                  <div className={styles.timelineTop}>
                    <strong className={styles.timelineItemTitle}>
                      {item.label}
                    </strong>

                    {item.meta ? (
                      <span className={styles.timelineMeta}>{item.meta}</span>
                    ) : null}
                  </div>

                  <p className={styles.timelineItemText}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>{emptyText}</div>
        )}
      </article>
    </section>
  );
}

export default SummaryTimeline;
