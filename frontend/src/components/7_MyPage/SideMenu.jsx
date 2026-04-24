import React from "react";
import styles from "./SideMenu.module.css";

const menuItems = [
  {
    key: "dashboard",
    label: "홈",
    icon: "/assets/images/icon-home.png",
  },
  {
    key: "emotionReport",
    label: "감정 리포트",
    icon: "/assets/images/icon-emotion.png",
  },
  {
    key: "attendance",
    label: "출석/먹이주기",
    icon: "/assets/images/icon-attendance.png",
  },
  {
    key: "letterBox",
    label: "쪽지함",
    icon: "/assets/images/icon-letter.png",
  },
  {
    key: "settings",
    label: "설정",
    icon: "/assets/images/icon-settings.png",
  },
];

function SideMenu({ activeMenu = "dashboard", onMenuClick = () => {} }) {
  return (
    <nav className={styles.menuCard} aria-label="마이페이지 메뉴">
      {menuItems.map((item) => {
        const isActive = activeMenu === item.key;

        return (
          <button
            key={item.key}
            type="button"
            className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
            onClick={() => onMenuClick(item.key)}
          >
            <span className={styles.iconWrap}>
              <img src={item.icon} alt={item.label} className={styles.icon} />
            </span>
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default SideMenu;
