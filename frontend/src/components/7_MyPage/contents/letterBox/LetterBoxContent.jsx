import React, { useEffect, useState } from 'react';
import styles from './LetterBoxContent.module.css';
import useAnimatedNumber, { usePrefersReducedMotion } from '../../hooks/useAnimatedNumber';
import { myPageAPI } from 'utils/api';
import LetterArchiveModal from './LetterArchiveModal';
import LetterDetailModal from './LetterDetailModal';

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
    { label: '내 쪽지 보관함', value: '3' },
    { label: '읽지 않은 쪽지', value: '3' },
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

function LetterBoxContent({ letterData = defaultLetters, onRead, onOpenArchive }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  console.log(letterData);
  const [expandedId, setExpandedId] = useState(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);

  const handleLetterClick = (id, unread) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (unread && onRead) {
        onRead(id);
      }
    }
  };

  const visibleItems = letterData.items.filter(item => item.unread || expandedId === item.id);
  const readItems = letterData.items.filter(item => !item.unread && expandedId !== item.id);

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
        <article
          className={styles.featuredCard}
          onClick={() => {
            if (letterData.featured.id) {
              setIsFeaturedModalOpen(true);
              if (letterData.featured.unread && onRead) {
                onRead(letterData.featured.id);
              }
            }
          }}
          style={{ cursor: letterData.featured.id ? 'pointer' : 'default' }}
        >
          <div className={styles.featuredTop}>
            <span className={styles.featuredBadge}>{letterData.featured.status}</span>
            {letterData.featured.date ? (
              <span className={styles.featuredDate}>{letterData.featured.date}</span>
            ) : null}
          </div>

          <div className={styles.featuredBody}>
            <span className={styles.featuredSender}>{letterData.featured.sender}</span>
            <h3 className={styles.featuredTitle}>{letterData.featured.title}</h3>
            <p className={styles.featuredPreview}>
              {letterData.featured.preview}
            </p>
          </div>
        </article>

        <div className={styles.statColumn}>
          {letterData.stats.map((item, index) => (
            <div
              key={item.label}
              // '내 쪽지 보관함' 카드인 경우에만 클릭 핸들러와 스타일 적용
              onClick={() => {
                if (item.label === '내 쪽지 보관함') {
                  setIsArchiveOpen(true);
                }
              }}
              style={{ cursor: item.label === '내 쪽지 보관함' ? 'pointer' : 'default' }}
            >
              <AnimatedStatCard
                item={item}
                index={index}
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.listGrid}>
        {visibleItems.map((item) => (
          <article
            key={item.id}
            className={`${styles.letterCard} ${item.unread ? styles.unreadCard : ''}`}
            onClick={() => handleLetterClick(item.id, item.unread)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.letterTop}>
              <span className={styles.letterSender}>{item.sender}</span>
              <span className={styles.letterDate}>{item.date}</span>
            </div>

            <h3 className={styles.letterTitle}>{item.title}</h3>
            <p className={styles.letterPreview}>
              {expandedId === item.id && item.content ? item.content : item.preview}
            </p>

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

      {isArchiveOpen && (
        <LetterArchiveModal
          isOpen={isArchiveOpen}
          onClose={() => setIsArchiveOpen(false)}
          archivedItems={readItems}
        />
      )}

      {isFeaturedModalOpen && (
        <LetterDetailModal
          isOpen={isFeaturedModalOpen}
          onClose={() => setIsFeaturedModalOpen(false)}
          letter={letterData.featured}
        />
      )}
    </section>
  );
}

export default LetterBoxContent;
