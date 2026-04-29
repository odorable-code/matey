import React from "react";
import styles from "./LetterItem.module.css";

const getLetterMeta = (type) => {
  switch (type) {
    case "RECONNECT":
      return {
        label: "응원",
        badgeClassName: styles.encourageBadge,
        toneClassName: styles.toneBlue,
      };

    case "MIDNIGHT":
    case "HIGH_RISK":
      return {
        label: "위로",
        badgeClassName: styles.comfortBadge,
        toneClassName: styles.tonePurple,
      };

    case "GIFT":
      return {
        label: "이벤트",
        badgeClassName: styles.eventBadge,
        toneClassName: styles.toneYellow,
      };

    case "EMOTION_GROWTH":
      return {
        label: "감정성장",
        badgeClassName: styles.growthBadge,
        toneClassName: styles.toneMint,
      };

    default:
      return {
        label: "응원",
        badgeClassName: styles.encourageBadge,
        toneClassName: styles.toneBlue,
      };
  }
};

function LetterItem({ letter, botAvatar = "/images/rabbit.png" }) {
  const meta = getLetterMeta(letter.type);

  return (
    <button type="button" className={styles.item}>
      <div className={styles.avatarWrap}>
        <div className={styles.avatarGlow} aria-hidden="true" />
        <img
          src={botAvatar}
          alt="메이티 아바타"
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

        <span className={styles.metaRow}>
          <span
            className={`${styles.smallPill} ${meta.toneClassName}`}
            aria-hidden="true"
          >
            {meta.label}
          </span>

          {!letter.isRead ? <span className={styles.unreadDot} /> : null}
        </span>
      </div>
    </button>
  );
}

export default LetterItem;
