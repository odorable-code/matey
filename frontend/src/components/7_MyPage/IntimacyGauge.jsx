import React from "react";
import styles from "./IntimacyGauge.module.css";

function IntimacyGauge({
  level = 1,
  score = 0,
  nextLevelScore = 100,
  gaugeImage = "/images/intimacy-gauge-placeholder.png",
}) {
  const remainingScore = Math.max(nextLevelScore - score, 0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.gaugeBox}>
        <div className={styles.gaugeImageWrap}>
          <img
            src={gaugeImage}
            alt="친밀도 게이지"
            className={styles.gaugeImage}
          />
        </div>

        <div className={styles.centerLabel}>
          <span className={styles.levelText}>Lv.{level}</span>
        </div>
      </div>

      <p className={styles.scoreText}>다음 레벨까지 {remainingScore}점</p>
    </div>
  );
}

export default IntimacyGauge;
