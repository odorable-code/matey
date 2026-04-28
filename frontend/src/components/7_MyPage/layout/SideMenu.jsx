import React from 'react';
import styles from './SideMenu.module.css';

function SideMenu({ items = [], activeKey, onSelect }) {
  return (
    <nav className={styles.card} aria-label="마이페이지 메뉴">
      <ul className={styles.menuList}>
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <li key={item.key} className={styles.menuItem}>
              <button
                type="button"
                className={`${styles.menuButton} ${isActive ? styles.active : ''}`}
                onClick={() => onSelect?.(item.key)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={styles.textGroup}>
                  <span className={styles.label}>{item.label}</span>
                  <span className={styles.description}>{item.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default SideMenu;
