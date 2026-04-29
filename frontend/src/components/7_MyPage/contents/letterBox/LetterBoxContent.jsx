import React from 'react';
import styles from './LetterBoxContent.module.css';
import useAnimatedNumber, { usePrefersReducedMotion } from '../../hooks/useAnimatedNumber';

const defaultLetters = {
  featured: {
    title: '오늘 하루는 어땠어?',
    sender: '메이티',
    preview:
      '조금 지친 날처럼 보여서 먼저 편지를 남겨둘게. 오늘 잘 버틴 것만으로도 충분해.',
    date: '방금 전',
    status: '새 편지',
  },
  stats: [
    { label: '읽지 않은 편지', value: '3' },
    { label: '이번 주 도착', value: '7' },
  ],
  items: [
    {
      id: 1,
      sender: '메이티',
      title: '잠들기 전에 읽어줘',
      preview: '하루 끝에 마음이 복잡하면 짧게라도 정리해보자.',
      date: '오늘',
      unread: true,
    },
    {
      id: 2,
      sender: '메이티',
      title: '조금 느리게 가도 괜찮아',
      preview: '속도를 줄여도 방향을 잃는 건 아니야.',
      date: '어제',
      unread: true,
    },
    {
      id: 3,
      sender: '메이티',
      title: '잘하고 있다는 기록',
      preview: '요즘의 너를 보면 천천히 균형을 다시 잡아가는 중이야.',
      date: '2일 전',
      unread: false,
    },
    {
      id: 4,
      sender: '메이티',
      title: '오늘의 작은 칭찬',
      preview: '별것 아닌 것 같아도 계속 해내고 있다는 점이 대단해.',
      date: '3일 전',
      unread: false,
    },
  ],
};

function AnimatedStatCard({ item, index, prefersReducedMotion }) {
  const numericValue = Number(item.value);
  const isNumeric = Number.isFinite(numericValue);

  const animatedValue = useAnimatedNumber(isNumeric ? numericValue : 0, 900 + index * 180, {
    reducedMotion: prefersReducedMotion,
  });

  return (
    <article className={styles.statCard}>
      <span className={styles.statLabel}>{item.label}</span>
      <strong className={styles.statValue}>
        {isNumeric ? animatedValue : item.value}
      </strong>
    </article>
  );
}

function LetterBoxContent({ letterData = defaultLetters }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>LETTER BOX</span>
          <h2 className={styles.title}>쪽지함</h2>
          <p className={styles.description}>
            메이티가 남긴 메시지를 더 가볍게 훑어볼 수 있게 정리했어요.
          </p>
        </div>
      </header>

      <div className={styles.heroGrid}>
        <article className={styles.featuredCard}>
          <div className={styles.featuredTop}>
            <span className={styles.featuredBadge}>{letterData.featured.status}</span>
            <span className={styles.featuredDate}>{letterData.featured.date}</span>
          </div>

          <div className={styles.featuredBody}>
            <span className={styles.featuredSender}>{letterData.featured.sender}</span>
            <h3 className={styles.featuredTitle}>{letterData.featured.title}</h3>
            <p className={styles.featuredPreview}>{letterData.featured.preview}</p>
          </div>
        </article>

        <div className={styles.statColumn}>
          {letterData.stats.map((item, index) => (
            <AnimatedStatCard
              key={item.label}
              item={item}
              index={index}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </div>

      <div className={styles.listGrid}>
        {letterData.items.map((item) => (
          <article
            key={item.id}
            className={`${styles.letterCard} ${item.unread ? styles.unreadCard : ''}`}
          >
            <div className={styles.letterTop}>
              <span className={styles.letterSender}>{item.sender}</span>
              <span className={styles.letterDate}>{item.date}</span>
            </div>

            <h3 className={styles.letterTitle}>{item.title}</h3>
            <p className={styles.letterPreview}>{item.preview}</p>

            <div className={styles.letterBottom}>
              {item.unread ? (
                <span className={styles.unreadBadge}>읽지 않음</span>
              ) : (
                <span className={styles.readBadge}>읽음</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default LetterBoxContent;
