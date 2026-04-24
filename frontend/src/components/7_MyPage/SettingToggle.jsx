import React from "react";
import styles from "./SettingToggle.module.css";

function SettingToggle({
  title,
  description = "",
  checked = false,
  onChange = () => {},
}) {
  const toggleImage = checked
    ? "/images/toggle-on.png"
    : "/images/toggle-off.png";

  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <p className={styles.title}>{title}</p>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>

      <button
        type="button"
        className={styles.toggleButton}
        onClick={onChange}
        aria-pressed={checked}
        aria-label={`${title} ${checked ? "켜짐" : "꺼짐"}`}
      >
        <img
          src={toggleImage}
          alt={checked ? "켜짐" : "꺼짐"}
          className={styles.toggleImage}
        />
      </button>
    </div>
  );
}

export default SettingToggle;
