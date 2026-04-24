import React, { useMemo, useState } from "react";
import LetterItem from "../LetterItem";
import styles from "./LetterBoxContent.module.css";

// TODO: API 연동
const dummyBot = {
  name: "메이티",
  avatarImage: "/images/avatar-default.png",
};

// TODO: API 연동
const dummyLetters = [
  {
    id: 1,
    type: "RECONNECT",
    title: "오랜만이야!",
    content: "요즘 어떻게 지내고 있어? 네 이야기를 다시 들을 수 있어서 반가워.",
    isRead: false,
    createdAt: "2026-04-23",
  },
  {
    id: 2,
    type: "EMOTION_GROWTH",
    title: "감정이 차곡차곡 쌓이고 있어요",
    content: "최근 편안한 감정이 자주 보여서 흐름이 한결 부드럽게 이어지고 있어.",
    isRead: true,
    createdAt: "2026-04-20",
  },
  {
    id: 3,
    type: "GIFT",
    title: "선물이 도착했어요",
    content: "출석 보상으로 만능사료 3개를 받았어. 오늘도 함께 시간을 보내보자.",
    isRead: true,
    createdAt: "2026-04-18",
  },
  {
    id: 4,
    type: "MIDNIGHT",
    title: "오늘 하루도 수고했어",
    content: "잠들기 전까지 마음이 조금 바빴다면, 지금은 천천히 쉬어가도 괜찮아.",
    isRead: false,
    createdAt: "2026-04-16",
  },
];

const filterItems = [
  { key: "all", label: "전체" },
  { key: "encourage", label: "응원" },
  { key: "comfort", label: "위로" },
  { key: "event", label: "이벤트" },
  { key: "growth", label: "감정성장" },
];

const typeToFilterMap = {
  RECONNECT: "encourage",
  MIDNIGHT: "comfort",
  HIGH_RISK: "comfort",
  GIFT: "event",
  EMOTION_GROWTH: "growth",
};

function LetterBoxContent() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredLetters = useMemo(() => {
    if (activeFilter === "all") {
      return dummyLetters;
    }

    return dummyLetters.filter(
      (letter) => typeToFilterMap[letter.type] === activeFilter
    );
  }, [activeFilter]);

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>쪽지함</h2>
        <p className={styles.subtitle}>봇이 보내준 따뜻한 메시지예요</p>
      </header>

      <div className={styles.filterTabs}>
        {filterItems.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`${styles.filterButton} ${
              activeFilter === filter.key ? styles.activeFilter : ""
            }`}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className={styles.listCard}>
        {filteredLetters.length > 0 ? (
          filteredLetters.map((letter) => (
            <LetterItem
              key={letter.id}
              letter={letter}
              botAvatar={dummyBot.avatarImage}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>아직 도착한 쪽지가 없어요</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default LetterBoxContent;
