import React, { useMemo } from 'react';
import styles from './TopicTags.module.css';

function TopicTags({
  title = '자주 등장한 주제',
  subtitle = '대화 안에서 자주 반복되거나 중심이 되었던 주제를 태그 형태로 정리한 영역이에요.',
  tags = [],
  notes = [],
  emptyText = '아직 표시할 주제 데이터가 없어요.',
  className = '',
}) {
  const normalizedTags = useMemo(() => {
    if (!Array.isArray(tags) || tags.length === 0) {
      return [];
    }

    return tags.filter(Boolean);
  }, [tags]);

  const normalizedNotes = useMemo(() => {
    if (!Array.isArray(notes) || notes.length === 0) {
      return [];
    }

    return notes.filter(Boolean).slice(0, 5);
  }, [notes]);

  const sectionClassName = [styles.section, className].filter(Boolean).join(' ');

  return (
    <section className={sectionClassName}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>TOPIC TAGS</span>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>

        <p className={styles.sectionDescription}>{subtitle}</p>
      </div>

      <article className={styles.card}>
        {normalizedTags.length > 0 ? (
          <div className={styles.tagList}>
            {normalizedTags.map((tag, index) => (
              <span key={`${tag}-${index}`} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>{emptyText}</div>
        )}

        {normalizedNotes.length > 0 ? (
          <ul className={styles.noteList}>
            {normalizedNotes.map((note, index) => (
              <li key={`${note}-${index}`} className={styles.noteItem}>
                {note}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </section>
  );
}

export default TopicTags;
