import React from "react";
import styles from "./LetterItem.module.css";

const getLetterMeta = (type) => {
  switch (type) {
    case "RECONNECT":
      return {
        label: "응원",
        badgeClassName: styles.encourageBadge,
      };
    case "MIDNIGHT":
    case "HIGH_RISK":
      return {
        label: "위로",
        badgeClassName: styles.comfortBadge,
      };
    case "GIFT":
      return {
        label: "이벤트",
        badgeClassName: styles.eventBadge,
      };
    case "EMOTION_GROWTH":
      return {
        label: "감정성장",
        badgeClassName: styles.growthBadge,
      };
    default:
      return {
        label: "응원",
        badgeClassName: styles.encourageBadge,
      };
  }
};

function LetterItem({ letter, botAvatar = "/images/avatar-default.png" }) {
  const meta = getLetterMeta(letter.type);

  return (
    <button type="button" className={styles.item}>
      <div className={styles.avatarWrap}>
        <img
          src={botAvatar}
          alt="봇 아바타"
          className={styles.avatarImage}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={`${styles.badge} ${meta.badgeClassName}`}>
            {meta.label}
          </span>
          <h3 className={styles.title}>{letter.title}</h3>
        </div>

        <p className={styles.preview}>{letter.content}</p>
      </div>

      <div className={styles.rightArea}>
        <span className={styles.date}>{letter.createdAt}</span>
        {!letter.isRead && <span className={styles.unreadDot} />}
      </div>
    </button>
  );
}

export default LetterItem;
