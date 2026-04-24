import React from "react";
import FloatingIcons from "../FloatingIcons";
import styles from "./DashboardContent.module.css";

function DashboardContent({
  recentChat,
  weeklyEmotion,
  intimacy,
  inventory,
}) {
  const intimacyPercent = Math.min(
    Math.round((intimacy.score / intimacy.nextLevelScore) * 100),
    100
  );

  return (
    <section className={styles.dashboard}>
      <div className={styles.roomImageWrap}>
        <img
          src="/images/room-3d.png"
          alt="내 방"
          className={styles.roomImage}
        />
      </div>

      <div className={styles.speechBubble}>
        <p className={styles.speechText}>안녕! 오늘도 방문했네?</p>
      </div>

      <FloatingIcons />

      <div className={styles.summaryArea}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>최근 상담</p>
          <p className={styles.summaryValue}>{recentChat.title}</p>
          <p className={styles.summarySub}>{recentChat.preview}</p>
        </div>

        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>이번 주 감정</p>
          <p className={styles.summaryValue}>{weeklyEmotion.name}</p>
          <p className={styles.summarySub}>{weeklyEmotion.summary}</p>
        </div>

        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>친밀도</p>
          <p className={styles.summaryValue}>Lv.{intimacy.level}</p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${intimacyPercent}%` }}
            />
          </div>
          <p className={styles.summarySub}>
            {intimacy.score} / {intimacy.nextLevelScore}
          </p>
        </div>

        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>만능사료</p>
          <p className={styles.summaryValue}>{inventory.universalFeedCount}개</p>
          <p className={styles.summarySub}>먹이를 주면 친해져요</p>
        </div>
      </div>
    </section>
  );
}

export default DashboardContent;
