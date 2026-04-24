import React, { useMemo, useState } from "react";
import EmotionSummaryCard from "../EmotionSummaryCard";
import styles from "./EmotionReportContent.module.css";

// TODO: API 연동
const dummyEmotions = [
  {
    name: "편안함",
    ratio: 42,
    count: 15,
    color: "#7C5CFC",
    bg: "#F5F0FF",
    icon: "/images/emotion-calm.png",
  },
  {
    name: "기쁨",
    ratio: 28,
    count: 10,
    color: "#FFD166",
    bg: "#FFF8E1",
    icon: "/images/emotion-happy.png",
  },
  {
    name: "슬픔",
    ratio: 18,
    count: 6,
    color: "#7EC8E3",
    bg: "#E8F4FD",
    icon: "/images/emotion-sad.png",
  },
  {
    name: "화남",
    ratio: 12,
    count: 4,
    color: "#FFB3C6",
    bg: "#FFF0F3",
    icon: "/images/emotion-angry.png",
  },
];

// TODO: API 연동
const dummyTopics = [
  "일상 이야기",
  "학교 고민",
  "친구 관계",
  "잠이 안 올 때",
  "기분 전환",
];

// TODO: API 연동
const dummyBot = {
  name: "메이티",
  avatarImage: "/images/avatar-default.png",
};

const topicColors = [
  "var(--primary-bg)",
  "#FFF8E1",
  "#E8F4FD",
  "#FFF0F3",
  "var(--pink)",
];

function EmotionReportContent() {
  const [activeTab, setActiveTab] = useState("weekly");

  const interpretationMessage = useMemo(() => {
    if (activeTab === "weekly") {
      return "이번 주는 '편안함' 감정이 가장 많았어요. 대화를 통해 마음이 차분해지고 있는 것 같아요 😊";
    }

    return "이번 달에는 다양한 감정을 고르게 느꼈어요. 천천히 나를 돌아보는 시간이 잘 쌓이고 있어요 😊";
  }, [activeTab]);

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>이번 달의 감정 기록이에요</h2>
        <p className={styles.subtitle}>나의 감정 흐름을 가볍게 살펴봐요</p>
      </header>

      <section className={styles.summarySection}>
        {dummyEmotions.map((emotion) => (
          <EmotionSummaryCard key={emotion.name} emotion={emotion} />
        ))}
      </section>

      <section className={styles.graphSection}>
        <div className={styles.graphHeader}>
          <div className={styles.tabGroup}>
            <button
              type="button"
              className={`${styles.tabButton} ${
                activeTab === "weekly" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("weekly")}
            >
              주간
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${
                activeTab === "monthly" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("monthly")}
            >
              월간
            </button>
          </div>
        </div>

        <div className={styles.graphPlaceholder}>
          <p className={styles.graphText}>감정 변화 그래프가 여기에 표시됩니다</p>
        </div>

        <p className={styles.interpretation}>{interpretationMessage}</p>
      </section>

      <section className={styles.topicSection}>
        <h3 className={styles.sectionTitle}>자주 이야기한 주제</h3>

        <div className={styles.topicList}>
          {dummyTopics.map((topic, index) => (
            <span
              key={topic}
              className={styles.topicTag}
              style={{ background: topicColors[index % topicColors.length] }}
            >
              {topic}
            </span>
          ))}
        </div>
      </section>

      <section className={styles.careSection}>
        <div className={styles.botAvatarWrap}>
          <img
            src={dummyBot.avatarImage}
            alt={dummyBot.name}
            className={styles.botAvatar}
          />
        </div>

        <p className={styles.careMessage}>
          요즘 편안한 감정이 많이 느껴지고 있어요.
          <br />
          계속 이렇게 좋은 흐름이 이어지길 바랄게요!
        </p>
      </section>
    </section>
  );
}

export default EmotionReportContent;
