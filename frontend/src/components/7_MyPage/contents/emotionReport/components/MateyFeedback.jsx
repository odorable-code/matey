import React, { useMemo } from 'react';
import styles from './MateyFeedback.module.css';

function MateyFeedback({
  title = '메이티 피드백',
  subtitle = '현재 기간의 감정 흐름을 메이티 시선으로 정리해서 보여주는 영역이에요.',
  feedbackTitle = '메이티 피드백',
  feedbackBody = '',
  toneTags = [],
  emphasis = '',
  className = '',
}) {
  const normalizedToneTags = useMemo(() => {
    if (!Array.isArray(toneTags) || toneTags.length === 0) {
      return [];
    }

    return toneTags.filter(Boolean).slice(0, 4);
  }, [toneTags]);

  const sectionClassName = [styles.section, className].filter(Boolean).join(' ');

  return (
    <section className={sectionClassName}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>MATEY FEEDBACK</span>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>

        <p className={styles.sectionDescription}>{subtitle}</p>
      </div>

      <article className={styles.card}>
        <div className={styles.topBlock}>
          <span className={styles.feedbackLabel}>메이티 해석</span>
          <strong className={styles.feedbackTitle}>{feedbackTitle}</strong>
        </div>

        {emphasis ? (
          <div className={styles.emphasisBox}>
            <span className={styles.emphasisLabel}>한 줄 요약</span>
            <strong className={styles.emphasisText}>{emphasis}</strong>
          </div>
        ) : null}

        {feedbackBody ? (
          <p className={styles.feedbackBody}>{feedbackBody}</p>
        ) : (
          <div className={styles.emptyState}>
            아직 표시할 메이티 피드백 데이터가 없어요.
          </div>
        )}

        {normalizedToneTags.length > 0 ? (
          <div className={styles.tagRow}>
            {normalizedToneTags.map((tag, index) => (
              <span key={`${tag}-${index}`} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}

export default MateyFeedback;
