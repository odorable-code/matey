import React, { useMemo } from 'react';
import styles from './TabNavigation.module.css';

const DEFAULT_TABS = [
  {
    key: 'emotion',
    label: '감정 분석',
    description: '감정 분포와 흐름 요약',
  },
  {
    key: 'history',
    label: '대화 히스토리',
    description: '대화 기록과 타임라인',
  },
];

function TabNavigation({
  tabs = DEFAULT_TABS,
  activeKey = 'emotion',
  onChange,
  tabIdPrefix = 'emotion-report-tab',
  panelIdPrefix = 'emotion-report-panel',
}) {
  const normalizedTabs = useMemo(() => {
    if (!Array.isArray(tabs) || tabs.length === 0) {
      return DEFAULT_TABS;
    }
    return tabs;
  }, [tabs]);

  return (
    <nav className={styles.wrapper} aria-label="감정 리포트 탭 메뉴">
      <div
        className={styles.tabList}
        role="tablist"
        aria-orientation="horizontal"
      >
        {normalizedTabs.map((tab) => {
          const isActive = tab.key === activeKey;

          return (
            <button
              key={tab.key}
              id={`${tabIdPrefix}-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${panelIdPrefix}-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tabButton} ${isActive ? styles.active : ''}`}
              onClick={() => onChange?.(tab.key)}
            >
              <span className={styles.textGroup}>
                <span className={styles.label}>{tab.label}</span>
                <span className={styles.description}>
                  {tab.description || ''}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default TabNavigation;
