import React, { useMemo } from 'react';
import styles from './ChatDetail.module.css';

function ChatDetail({
  title = '대화 상세',
  subtitle = '기억에 남는 대화 장면을 말풍선 형태로 정리해서 보여주는 영역이에요.',
  items = [],
  emptyText = '아직 표시할 대화 상세 데이터가 없어요.',
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
            key: `chat-${index}`,
            speaker: index % 2 === 0 ? '나' : '메이티',
            text: item,
            emotion: '',
            time: '',
          };
        }

        return {
          key: item.key || `chat-${index}`,
          speaker: item.speaker || '나',
          text: item.text || '',
          emotion: item.emotion || '',
          time: item.time || '',
        };
      });
  }, [items]);

  const sectionClassName = [styles.section, className].filter(Boolean).join(' ');

  return (
    <section className={sectionClassName}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>CHAT DETAIL</span>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>

        <p className={styles.sectionDescription}>{subtitle}</p>
      </div>

      <article className={styles.card}>
        {normalizedItems.length > 0 ? (
          <div className={styles.chatList}>
            {normalizedItems.map((item, index) => {
              const isMatey =
                String(item.speaker).includes('메이티') ||
                String(item.speaker).toLowerCase().includes('matey');

              return (
                <div
                  key={item.key}
                  className={`${styles.chatItem} ${isMatey ? styles.matey : styles.user}`}
                >
                  <div className={styles.avatar}>
                    {isMatey ? 'M' : index + 1}
                  </div>

                  <div className={styles.bubbleWrap}>
                    <div className={styles.metaRow}>
                      <strong className={styles.speaker}>{item.speaker}</strong>

                      <div className={styles.metaGroup}>
                        {item.emotion ? (
                          <span className={styles.emotionBadge}>{item.emotion}</span>
                        ) : null}

                        {item.time ? (
                          <span className={styles.timeText}>{item.time}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className={styles.bubble}>{item.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>{emptyText}</div>
        )}
      </article>
    </section>
  );
}

export default ChatDetail;
