/**
 * [파일 용도]
 * 대화 데이터에서 추출된 주요 키워드(태그)와 추가적인 분석 메모를 시각화하는 리포트 컴포넌트입니다.
 * 사용자가 어떤 주제로 대화를 나눴는지 한눈에 파악할 수 있도록 해시태그 클라우드와 리스트 형태로 정보를 제공합니다.
 */

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
