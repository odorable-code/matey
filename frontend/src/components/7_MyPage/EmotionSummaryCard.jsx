import React from "react";
import styles from "./EmotionSummaryCard.module.css";

function EmotionSummaryCard({ emotion }) {
  return (
    <article
      className={styles.card}
      style={{
        background: emotion.bg,
        borderTop: `4px solid ${emotion.color}`,
      }}
    >
      <div className={styles.iconWrap}>
        <img
          src={emotion.icon}
          alt={emotion.name}
          className={styles.icon}
        />
      </div>

      <h3 className={styles.name}>{emotion.name}</h3>
      <p className={styles.ratio} style={{ color: emotion.color }}>
        {emotion.ratio}%
      </p>
      <p className={styles.count}>{emotion.count}회 감지</p>
    </article>
  );
}

export default EmotionSummaryCard;
