/**
 * [파일 역할]
 * - 감정 리포트 화면의 메인 분기 파일
 * - 상단 탭(감정 리포트 / 대화 히스토리)과 기간 선택 UI를 보여주고,
 *   현재 선택 상태에 따라 EmotionTab 또는 ChatHistoryTab을 렌더링함
 *
 * [여기서 찾을 것]
 * - 현재 탭이 히스토리인지 판별: isHistoryTab (utils에서 import)
 * - 상단 제목/설명 문구: headingCopy
 * - 감정 리포트 탭 렌더링: <EmotionTab />
 * - 대화 히스토리 탭 렌더링: <ChatHistoryTab />
 *
 * [수정 포인트]
 * - 상단 제목/설명 바꾸기: headingCopy
 * - 어떤 탭에서 어떤 컴포넌트를 보여줄지 바꾸기: return 아래 contentArea 부분
 *
 * [이전 대비 달라진 점]
 * - DEFAULT_TAB_OPTIONS, DEFAULT_PERIOD_OPTIONS → constants.js에서 import
 * - getOptionKey, getOptionLabel, cx, isHistoryTab → utils.js에서 import
 * - 이 파일에서 중복 선언하던 상수/함수가 전부 사라짐
 * - "화면 분기 + 상단 UI" 역할만 남음
 */

import React, { useEffect, useMemo } from 'react';
import { emotionReportAPI } from 'utils/api';
import styles from './EmotionReportContent.module.css';
import EmotionTab from './tabs/EmotionTab';
import ChatHistoryTab from './tabs/ChatHistoryTab';
import useEmotionReport from '../../hooks/emotionReport/useEmotionReport';
/* =========================
   상수와 유틸 함수를 공용 파일에서 가져옴
   - 이전에는 이 파일 안에 따로 선언했지만,
     이제는 한 곳에서 관리해서 중복이 없음
========================= */
import {
  DEFAULT_TAB_OPTIONS,
  DEFAULT_PERIOD_OPTIONS,
} from '../../hooks/emotionReport/emotionReport.constants';

import {
  cx,
  getOptionKey,
  getOptionLabel,
  isHistoryTab,
} from '../../hooks/emotionReport/emotionReport.utils';

function EmotionReportContent() {
  /* =========================
     감정 리포트 전체 상태 가져오기
     - 탭, 기간, 날짜, 봇 선택 상태를 전부 여기서 받아옴
     - useEmotionReport 훅 하나로 모든 상태가 관리됨
  ========================= */
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

  /* =========================
      2. [추가] 서버 데이터 요청 로직 (useEffect)
      - 사용자가 기간(Period)이나 동물(Bot)을 클릭해 상태가 변하면 실행됩니다.
  ========================= */
  useEffect(() => {
    const fetchData = async () => {
      // 초기 렌더링 시 값이 없을 경우를 대비한 가드 코드
      if (!selectedPeriod || !selectedBotKey) return;

      try {
        // 올바른 백엔드 API (api.js 경유)
        await emotionReportAPI.getDashboard();

      } catch (error) {
        console.error("감정 리포트 데이터 로드 실패:", error);
      }
    };

    fetchData();
  }, [selectedPeriod, selectedBotKey]); // [중요] 사용자가 클릭해서 값이 바뀔 때마다 자동 실행

  /* =========================
     탭 옵션 / 기간 옵션 기본값 보정
     - 훅에서 받은 데이터가 비어 있으면 기본값(DEFAULT_) 사용
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
     - activeTab 값으로 탭 목록에서 찾음
     - 못 찾으면 첫 번째 탭을 기본으로 사용
  ========================= */
  const currentTab =
    resolvedTabOptions.find((item) => getOptionKey(item) === activeTab) ||
    resolvedTabOptions[0] ||
    DEFAULT_TAB_OPTIONS[0];

  const currentTabKey = getOptionKey(currentTab) || 'emotion';
  const currentTabLabel = getOptionLabel(currentTab) || '감정 리포트';

  /* --- 현재 탭이 대화 히스토리인지 여부 --- */
  const historyMode = isHistoryTab(currentTabKey, currentTabLabel);

  /* =========================
     현재 선택된 기간 계산
     - 값이 없으면 두 번째 옵션(최근 30일)을 기본으로 사용
  ========================= */
  const currentPeriodKey =
    selectedPeriod ||
    getOptionKey(resolvedPeriodOptions[1]) ||
    getOptionKey(resolvedPeriodOptions[0]) ||
    '30d';

  /* =========================
     상단 제목 / 설명 문구
     - 감정 리포트 모드와 대화 히스토리 모드에서 다르게 표시
     *
     * [문구 수정 포인트]
     * - 상단 타이틀/설명을 바꾸려면 여기만 수정하면 됨
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
     - 상단: 제목 + 탭 버튼
     - 중단: 기간 선택 (감정 리포트 탭에서만)
     - 하단: 탭에 따라 EmotionTab 또는 ChatHistoryTab
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
        {/* --- 제목 + 설명 --- */}
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>{headingCopy.eyebrow}</span>
          <h2 className={styles.title}>{headingCopy.title}</h2>
          <p className={styles.description}>{headingCopy.description}</p>
        </div>

        {/* --- 탭 전환 버튼 --- */}
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
          기간 선택 바
          - 감정 리포트 탭에서만 보임
          - 히스토리 탭에서는 숨김
      ========================= */}
      {!historyMode && (
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
      )}

      {/* =========================
          탭 내용 렌더링
          - historyMode === true → ChatHistoryTab
          - historyMode === false → EmotionTab
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
            //선택한 봇 키
            selectedBotKey={selectedBotKey}
            //기간선택에서 선택한 기간 종류로 7d, 30d, 90d가 들어감
            selectedPeriod={currentPeriodKey}
            //봇 클릭했을 때 실행할 함수
            onBotChange={handleBotChange}
            botOptions={botOptions}
          />
        )}
      </div>
    </section>
  );
}

export default EmotionReportContent;
