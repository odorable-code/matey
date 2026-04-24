import React from "react";
import AttendanceCalendar from "../AttendanceCalendar";
import IntimacyGauge from "../IntimacyGauge";
import styles from "./AttendanceFeedContent.module.css";

// TODO: API 연동
const dummyInventory = {
  universalFeedCount: 12,
};

// TODO: API 연동
const dummyIntimacy = {
  score: 340,
  level: 3,
  nextLevelScore: 500,
};

// TODO: API 연동
const dummyAttendance = [
  "2026-04-01",
  "2026-04-02",
  "2026-04-03",
  "2026-04-05",
  "2026-04-07",
  "2026-04-10",
  "2026-04-12",
  "2026-04-15",
  "2026-04-18",
  "2026-04-20",
  "2026-04-22",
  "2026-04-23",
];

// TODO: API 연동
const dummyUnlocks = [
  {
    id: 1,
    name: "인사 모션",
    level: 1,
    unlocked: true,
    icon: "/images/icon-game.png",
  },
  {
    id: 2,
    name: "기쁨 모션",
    level: 2,
    unlocked: true,
    icon: "/images/icon-heart.png",
  },
  {
    id: 3,
    name: "봄 배경",
    level: 3,
    unlocked: true,
    icon: "/images/icon-home.png",
  },
  {
    id: 4,
    name: "댄스 모션",
    level: 5,
    unlocked: false,
    icon: "/images/icon-lock.png",
  },
  {
    id: 5,
    name: "겨울 배경",
    level: 7,
    unlocked: false,
    icon: "/images/icon-lock.png",
  },
];

function AttendanceFeedContent() {
  return (
    <section className={styles.container}>
      <div className={styles.leftColumn}>
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>출석 체크</h2>

          <AttendanceCalendar
            year={2026}
            month={4}
            attendanceDates={dummyAttendance}
            today="2026-04-23"
          />

          <button type="button" className={styles.attendanceButton}>
            출석하기
          </button>
        </div>

        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>먹이주기</h2>

          <div className={styles.feedSummary}>
            <div>
              <p className={styles.feedLabel}>보유 만능사료</p>
              <p className={styles.feedValue}>
                {dummyInventory.universalFeedCount}개
              </p>
            </div>

            <div className={styles.feedImageWrap}>
              <img
                src="/images/icon-bowl.png"
                alt="만능사료"
                className={styles.feedImage}
              />
            </div>
          </div>

          <button type="button" className={styles.feedButton}>
            먹이주기
          </button>
        </div>
      </div>

      <div className={styles.rightColumn}>
        <div className={`${styles.sectionCard} ${styles.intimacyCard}`}>
          <h2 className={styles.sectionTitle}>친밀도</h2>

          <IntimacyGauge
            level={dummyIntimacy.level}
            score={dummyIntimacy.score}
            nextLevelScore={dummyIntimacy.nextLevelScore}
          />
        </div>

        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>해금 콘텐츠</h2>

          <div className={styles.unlockList}>
            {dummyUnlocks.map((item) => (
              <div
                key={item.id}
                className={`${styles.unlockItem} ${
                  item.unlocked ? styles.unlockActive : styles.unlockLocked
                }`}
              >
                <div className={styles.unlockIconWrap}>
                  <img
                    src={item.icon}
                    alt={item.name}
                    className={styles.unlockIcon}
                  />
                </div>

                <span className={styles.unlockName}>{item.name}</span>

                <span
                  className={`${styles.unlockBadge} ${
                    item.unlocked
                      ? styles.unlockBadgeActive
                      : styles.unlockBadgeLocked
                  }`}
                >
                  {item.unlocked ? "해금됨" : `Lv.${item.level} 해금`}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.motionSection}>
            <div className={styles.motionPreview}>
              <img
                src="/images/bot-motion-placeholder.png"
                alt="봇 모션 미리보기"
                className={styles.motionImage}
              />
            </div>

            <p className={styles.motionText}>먹이를 주면 반응이 바뀌어요!</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AttendanceFeedContent;
