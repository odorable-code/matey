/**
 * [파일 역할]
 * - 감정 리포트 화면의 메인 분기 파일
 * - 상단 탭(감정 리포트 / 대화 히스토리)과 기간 선택 UI를 보여주고,
 *   현재 선택 상태에 따라 EmotionTab 또는 ChatHistoryTab을 렌더링함
 *
 * [여기서 찾을 것]
 * - 탭 기본값: DEFAULT_TAB_OPTIONS
 * - 기간 기본값: DEFAULT_PERIOD_OPTIONS
 * - 현재 탭이 히스토리인지 판별: isHistoryTab
 * - 상단 제목/설명 문구: headingCopy
 * - 감정 리포트 탭 렌더링: <EmotionTab />
 * - 대화 히스토리 탭 렌더링: <ChatHistoryTab />
 *
 * [수정 포인트]
 * - 탭 이름 바꾸기: DEFAULT_TAB_OPTIONS
 * - 기간 버튼 문구 바꾸기: DEFAULT_PERIOD_OPTIONS
 * - 상단 제목/설명 바꾸기: headingCopy
 * - 어떤 탭에서 어떤 컴포넌트를 보여줄지 바꾸기: return 아래 contentArea 부분
 *
 * [주의]
 * - 실제 상태값은 useEmotionReport 훅에서 관리함
 * - 이 파일은 "화면 분기 + 상단 UI" 담당이라고 생각하면 쉬움
 */

import React, { useMemo } from 'react';
import styles from './EmotionReportContent.module.css';
import EmotionTab from './tabs/EmotionTab';
import ChatHistoryTab from './tabs/ChatHistoryTab';
import useEmotionReport from '../../hooks/emotionReport/useEmotionReport';

/* =========================
   className 합칠 때 쓰는 간단 함수
========================= */
const cx = (...items) => items.filter(Boolean).join(' ');

/* =========================
   탭 기본 목록
   - useEmotionReport 쪽 데이터가 없을 때 사용
========================= */
const DEFAULT_TAB_OPTIONS = [
  { key: 'emotion', label: '감정 리포트' },
  { key: 'history', label: '대화 히스토리' },
];

/* =========================
   기간 기본 목록
   - useEmotionReport 쪽 데이터가 없을 때 사용
========================= */
const DEFAULT_PERIOD_OPTIONS = [
  { key: '7d', label: '최근 7일' },
  { key: '30d', label: '최근 30일' },
  { key: '90d', label: '최근 90일' },
];

/* =========================
   option 데이터에서 key / label 안전하게 꺼내는 함수
========================= */
const getOptionKey = (item) =>
  item?.key ?? item?.value ?? item?.id ?? item?.tabKey ?? item?.periodKey ?? '';

const getOptionLabel = (item) =>
  item?.label ?? item?.name ?? item?.title ?? item?.text ?? '';

/* =========================
   현재 탭이 "대화 히스토리" 탭인지 판별하는 함수
   - key 또는 label에 history / 대화 / 히스토리 등이 들어있으면 히스토리로 판단
========================= */
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
  /* =========================
     감정 리포트 전체 상태 가져오는 코드
     - 탭, 기간, 날짜, 봇 선택 상태 전부 여기서 받아옴
  ========================= */
  const {
    isLoading,
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

  /* =========================
     탭 옵션 / 기간 옵션 기본값 보정
     - 데이터가 비어 있으면 DEFAULT 값 사용
  ========================= */
  const resolvedTabOptions = useMemo(
    () =>
      Array.isArray(tabOptions) && tabOptions.length > 0
        ? tabOptions
        : DEFAULT_TAB_OPTIONS,
    [tabOptions]
  );

  const resolvedPeriodOptions = useMemo(
    () =>
      Array.isArray(periodOptions) && periodOptions.length > 0
        ? periodOptions
        : DEFAULT_PERIOD_OPTIONS,
    [periodOptions]
  );

  /* =========================
     현재 선택된 탭 계산
  ========================= */
  const currentTab =
    resolvedTabOptions.find((item) => getOptionKey(item) === activeTab) ||
    resolvedTabOptions[0] ||
    DEFAULT_TAB_OPTIONS[0];

  const currentTabKey = getOptionKey(currentTab) || 'emotion';
  const currentTabLabel = getOptionLabel(currentTab) || '감정 리포트';
  const historyMode = isHistoryTab(currentTabKey, currentTabLabel);

  /* =========================
     현재 선택된 기간 계산
     - 값이 없으면 최근 30일 우선
  ========================= */
  const currentPeriodKey =
    selectedPeriod ||
    getOptionKey(resolvedPeriodOptions[1]) ||
    getOptionKey(resolvedPeriodOptions[0]) ||
    '30d';

  /* =========================
     상단 제목 / 설명 문구
     - 감정 리포트 모드인지 대화 히스토리 모드인지에 따라 달라짐
     *
     * [문구 수정 포인트]
     * - 여기만 바꾸면 상단 타이틀/설명 일괄 수정 가능
  ========================= */
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

  /* =========================
     실제 화면 렌더링
     - 상단 헤더
     - 탭 버튼
     - 기간 선택 버튼
     - 아래 컨텐츠 영역
  ========================= */
  return (
    <section
      className={cx(
        styles.page,
        historyMode ? styles.pageHistory : styles.pageEmotion
      )}
    >
      {/* =========================
          상단 제목 / 탭 버튼 영역
      ========================= */}
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
                  active && styles.headerTabActive
                )}
              >
                {historyTab ? '대화 히스토리' : '감정 리포트'}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================
          감정 리포트 탭에서만 보이는 기간 선택 바
          - historyMode일 때는 숨김
      ========================= */}
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
                    active && styles.filterButtonActive
                  )}
                >
                  {getOptionLabel(option)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* =========================
          실제 탭 내용 렌더링
          - 히스토리 탭이면 ChatHistoryTab
          - 감정 리포트 탭이면 EmotionTab
      ========================= */}
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
