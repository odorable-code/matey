import React from "react";
import styles from "./FloatingIcons.module.css";

const floatingItems = [
  {
    key: "heart",
    label: "하트 아이콘",
    icon: "/images/icon-heart.png",
    backgroundColor: "var(--magenta)",
    top: "22%",
    left: "45%",
  },
  {
    key: "care",
    label: "케어 아이콘",
    icon: "/images/icon-care.png",
    backgroundColor: "var(--pink-accent)",
    top: "18%",
    right: "22%",
  },
  {
    key: "list",
    label: "리스트 아이콘",
    icon: "/images/icon-list.png",
    backgroundColor: "var(--lavender)",
    top: "28%",
    right: "12%",
  },
  {
    key: "game",
    label: "게임 아이콘",
    icon: "/images/icon-game.png",
    backgroundColor: "var(--pink-bold)",
    top: "42%",
    right: "18%",
  },
  {
    key: "question",
    label: "질문 아이콘",
    icon: "/images/icon-question.png",
    backgroundColor: "var(--blue)",
    top: "58%",
    right: "20%",
  },
  {
    key: "bowl",
    label: "먹이 아이콘",
    icon: "/images/icon-bowl.png",
    backgroundColor: "var(--yellow)",
    top: "62%",
    left: "38%",
  },
];

function FloatingIcons() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      {floatingItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={styles.iconButton}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            backgroundColor: item.backgroundColor,
          }}
        >
          <span className={styles.iconImageWrap}>
            <img src={item.icon} alt={item.label} className={styles.iconImage} />
          </span>
        </button>
      ))}
    </div>
  );
}

export default FloatingIcons;
