import React from 'react';
import styles from './BotMenuContent.module.css';

const defaultBotData = {
  level: 4,
  remainPoint: 82,
  progressPercent: 68,
  summaryCards: [
    { title: '언락 배경', value: '6개', note: '현재 사용 가능' },
    { title: '모션 컬렉션', value: '14개', note: '최근 2개 추가' },
  ],
  interactions: ['먹이주기', '쓰다듬기', '놀아주기', '고민상담'],
  backgrounds: [
    { name: '노을 산책로', state: '사용 중' },
    { name: '포근한 침실', state: '보유' },
    { name: '별빛 정원', state: '보유' },
    { name: '비 오는 창가', state: '잠금' },
  ],
  motions: [
    { name: '반짝 점프', tag: 'NEW' },
    { name: '귀 흔들기', tag: '기본' },
    { name: '졸린 스트레칭', tag: '보유' },
    { name: '하트 인사', tag: '보유' },
  ],
};

function BotMenuContent({ botData = defaultBotData }) {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>BOT MENU</span>
          <h2 className={styles.title}>봇 메뉴</h2>
          <p className={styles.description}>
            메이티의 상태와 컬렉션을 한 번에 보기 쉽게 정리했어요.
          </p>
        </div>
      </header>

      <div className={styles.overviewGrid}>
        <article className={styles.levelCard}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>친밀도</h3>
            <span className={styles.softBadge}>LEVEL</span>
          </div>

          <div className={styles.levelValueRow}>
            <strong className={styles.levelValue}>Lv. {botData.level}</strong>
            <span className={styles.levelNote}>
              다음 레벨까지 {botData.remainPoint} 포인트
            </span>
          </div>

          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${botData.progressPercent}%` }}
            />
          </div>
        </article>

        {botData.summaryCards.map((item) => (
          <article key={item.title} className={styles.summaryCard}>
            <span className={styles.summaryTitle}>{item.title}</span>
            <strong className={styles.summaryValue}>{item.value}</strong>
            <p className={styles.summaryNote}>{item.note}</p>
          </article>
        ))}
      </div>

      <div className={styles.contentGrid}>
        <article className={styles.collectionCard}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>배경 컬렉션</h3>
            <span className={styles.softBadge}>BACKGROUND</span>
          </div>

          <div className={styles.collectionGrid}>
            {botData.backgrounds.map((item) => (
              <div key={item.name} className={styles.collectionItem}>
                <div className={styles.collectionThumb} />
                <div className={styles.collectionMeta}>
                  <strong className={styles.collectionName}>{item.name}</strong>
                  <span
                    className={`${styles.stateBadge} ${
                      item.state === '사용 중'
                        ? styles.stateActive
                        : item.state === '잠금'
                        ? styles.stateLocked
                        : styles.stateOwned
                    }`}
                  >
                    {item.state}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <div className={styles.sideStack}>
          <article className={styles.motionCard}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>모션 컬렉션</h3>
              <span className={styles.softBadge}>MOTION</span>
            </div>

            <div className={styles.motionList}>
              {botData.motions.map((item) => (
                <div key={item.name} className={styles.motionItem}>
                  <span className={styles.motionDot} />
                  <span className={styles.motionName}>{item.name}</span>
                  <span className={styles.motionTag}>{item.tag}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.interactionCard}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>상호작용</h3>
              <span className={styles.softBadge}>ACTION</span>
            </div>

            <div className={styles.interactionList}>
              {botData.interactions.map((item) => (
                <span key={item} className={styles.interactionChip}>
                  {item}
                </span>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default BotMenuContent;
