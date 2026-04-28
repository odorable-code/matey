import React, { useMemo } from 'react';
import styles from './EmotionReportContent.module.css';
import EmotionTab from './tabs/EmotionTab';
import ChatHistoryTab from './tabs/ChatHistoryTab';
import useEmotionReport from '../../hooks/emotionReport/useEmotionReport';

const cx = (...items) => items.filter(Boolean).join(' ');

const DEFAULT_TAB_OPTIONS = [
  { key: 'emotion', label: '감정 리포트' },
  { key: 'history', label: '대화 히스토리' },
];

const DEFAULT_PERIOD_OPTIONS = [
  { key: '7d', label: '최근 7일' },
  { key: '30d', label: '최근 30일' },
  { key: '90d', label: '최근 90일' },
];

const getOptionKey = (item) =>
  item?.key ?? item?.value ?? item?.id ?? item?.tabKey ?? item?.periodKey ?? '';

const getOptionLabel = (item) =>
  item?.label ?? item?.name ?? item?.title ?? item?.text ?? '';

const isHistoryTab = (tabKey, label) => {
  const raw = `${tabKey || ''} ${label || ''}`.toLowerCase();
  return (
    raw.includes('history') ||
    raw.includes('conversation') ||
    raw.includes('대화') ||
    raw.includes('히스토리')
  );
};

function EmotionReportContent() {
  const {
    activeTab,
    selectedPeriod,
    selectedBotKey,
    selectedDate,
    tabOptions = [],
    periodOptions = [],
    botOptions = [],
    reportData = {},
    emotionTabData = {},
    chatHistoryTabData = {},
    historyOverview = {},
    handleTabChange,
    handlePeriodChange,
    handleBotChange,
    handleDateChange,
  } = useEmotionReport();

  const resolvedTabOptions = useMemo(
    () =>
      Array.isArray(tabOptions) && tabOptions.length > 0
        ? tabOptions
        : DEFAULT_TAB_OPTIONS,
    [tabOptions],
  );

  const resolvedPeriodOptions = useMemo(
    () =>
      Array.isArray(periodOptions) && periodOptions.length > 0
        ? periodOptions
        : DEFAULT_PERIOD_OPTIONS,
    [periodOptions],
  );

  const currentTab =
    resolvedTabOptions.find((item) => getOptionKey(item) === activeTab) ||
    resolvedTabOptions[0] ||
    DEFAULT_TAB_OPTIONS[0];

  const currentTabKey = getOptionKey(currentTab) || 'emotion';
  const currentTabLabel = getOptionLabel(currentTab) || '감정 리포트';
  const historyMode = isHistoryTab(currentTabKey, currentTabLabel);

  const currentPeriodKey =
    selectedPeriod ||
    getOptionKey(resolvedPeriodOptions[1]) ||
    getOptionKey(resolvedPeriodOptions[0]) ||
    '30d';

  const headingCopy = historyMode
    ? {
        eyebrow: 'CONVERSATION HISTORY',
        title: '메이티 대화 히스토리',
        description:
          '선택한 날짜의 메모와 대화 흐름, 봇 해석을 한 눈에 정리해서 볼 수 있어요.',
      }
    : {
        eyebrow: 'EMOTION REPORT',
        title: '메이티 감정 리포트',
        description:
          '선택한 동물이 작성한 것처럼 핵심 감정과 흐름을 한 장의 리포트로 확인할 수 있어요.',
      };

  return (
    <section
      className={cx(
        styles.page,
        historyMode ? styles.pageHistory : styles.pageEmotion,
      )}
    >
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>{headingCopy.eyebrow}</span>
          <h2 className={styles.title}>{headingCopy.title}</h2>
          <p className={styles.description}>{headingCopy.description}</p>
        </div>

        <div className={styles.headerTabs}>
          {resolvedTabOptions.map((option) => {
            const optionKey = getOptionKey(option);
            const optionLabel = getOptionLabel(option) || optionKey;
            const active = optionKey === currentTabKey;
            const historyTab = isHistoryTab(optionKey, optionLabel);

            return (
              <button
                key={optionKey}
                type="button"
                onClick={() => handleTabChange(optionKey)}
                className={cx(
                  styles.headerTab,
                  historyTab ? styles.headerTabHistory : styles.headerTabEmotion,
                  active && styles.headerTabActive,
                )}
              >
                {historyTab ? '대화 히스토리' : '감정 리포트'}
              </button>
            );
          })}
        </div>
      </div>

      {!historyMode ? (
        <div className={styles.filterBar}>
          <span className={styles.filterLabel}>기간 선택</span>

          <div className={styles.filterRow}>
            {resolvedPeriodOptions.map((option) => {
              const optionKey = getOptionKey(option);
              const active = optionKey === currentPeriodKey;

              return (
                <button
                  key={optionKey}
                  type="button"
                  onClick={() => handlePeriodChange(optionKey)}
                  className={cx(
                    styles.filterButton,
                    active && styles.filterButtonActive,
                  )}
                >
                  {getOptionLabel(option)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={styles.contentArea}>
        {historyMode ? (
          <ChatHistoryTab
            data={chatHistoryTabData}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            selectedBotKey={selectedBotKey}
            botOptions={botOptions}
            reportData={reportData}
            historyOverview={historyOverview}
          />
        ) : (
          <EmotionTab
            data={emotionTabData}
            reportData={reportData}
            selectedBotKey={selectedBotKey}
            selectedPeriod={currentPeriodKey}
            onBotChange={handleBotChange}
            botOptions={botOptions}
          />
        )}
      </div>
    </section>
  );
}

export default EmotionReportContent;
