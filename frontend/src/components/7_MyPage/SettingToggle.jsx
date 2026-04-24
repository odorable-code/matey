import React from "react";
import styles from "./SettingToggle.module.css";

function SettingToggle({
  title,
  description = "",
  checked = false,
  onChange = () => {},
}) {
  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <p className={styles.title}>{title}</p>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>

      <button
        type="button"
        className={`${styles.toggle} ${checked ? styles.on : styles.off}`}
        onClick={onChange}
        aria-pressed={checked}
        aria-label={`${title} ${checked ? "켜짐" : "꺼짐"}`}
      >
        <span className={styles.thumb} />
      </button>
    </div>
  );
}

export default SettingToggle;
