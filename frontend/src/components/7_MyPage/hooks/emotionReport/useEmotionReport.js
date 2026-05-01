/**
 * [파일 역할]
 * - 감정 리포트 화면에서 쓰는 상태(state)를 한 곳에서 관리하는 커스텀 훅
 * - 탭, 기간, 캐릭터, 날짜 선택 상태를 관리하고,
 *   컴포넌트에서 가져다 쓸 수 있게 내보냄
 *
 * [여기서 찾을 것]
 * - 현재 선택 상태: activeTab / selectedPeriod / selectedBotKey / selectedDate
 * - 선택 변경 함수: handleTabChange / handlePeriodChange / handleBotChange / handleDateChange
 * - 탭별 데이터: emotionTabData / chatHistoryTabData / historyOverview
 *
 * [수정 포인트]
 * - API 연결 시작: rawReportData 부분 (아래 주석 참고)
 * - 상수/더미 데이터 수정: emotionReport.constants.js / emotionReport.fallback.js
 *
 * [이전 대비 달라진 점]
 * - 상수 → emotionReport.constants.js로 이동
 * - 유틸 함수 → emotionReport.utils.js로 이동
 * - 더미 데이터 → emotionReport.fallback.js로 이동
 * - 이 파일에는 "상태 관리 로직"만 남음
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

/* =========================
   상수, 유틸, 더미 데이터를 각각 가져옴
   - 이전에는 이 파일 안에 전부 있었지만,
     이제는 분리된 파일에서 import해서 사용
========================= */
import {
  DEFAULT_TAB_OPTIONS,
  DEFAULT_PERIOD_OPTIONS,
  FALLBACK_HERO_BOTS,
} from './emotionReport.constants';

import {
  getOptionKey,
  parseFlexibleDate,
  formatFullDateKey,
  formatShortKey,
  mergeUniqueByKey,
} from './emotionReport.utils';

import {
  FALLBACK_REPORT_DATA,
} from './emotionReport.fallback';

/* =========================
   날짜 옵션 정리 함수
   - 서버에서 받은 날짜 데이터를 통일된 형태로 변환
   - key, label, date 객체, fullKey, shortKey를 모두 갖춘 배열로 만들어줌
   *
   * [왜 여기 있나?]
   * - 이 함수는 훅 내부에서만 쓰이기 때문에 utils로 빼지 않고 여기에 둠
   * - 만약 다른 파일에서도 쓰게 되면 그때 utils로 이동하면 됨
========================= */
const normalizeDateOptions = (chatHistoryData = {}) => {
  /* --- 서버 데이터에서 날짜 배열 찾기 --- */
  const raw = chatHistoryData?.dateOptions ?? [];

  /* --- 날짜 배열이 있으면 정리해서 반환 --- */
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item) => {
        const key = getOptionKey(item);
        const label = item?.label ?? key;
        const date = parseFlexibleDate(key) || parseFlexibleDate(label) || null;

        return {
          key,
          label,
          date,
          fullKey: date ? formatFullDateKey(date) : '',
          shortKey: date ? formatShortKey(date) : '',
        };
      })
      .filter((item) => item.key);
  }

  /* --- 없으면 기본값 1개 반환 --- */
  return [
    {
      key: '04-21',
      label: '4월 21일',
      date: new Date(2026, 3, 21),
      fullKey: '2026-04-21',
      shortKey: '04-21',
    },
  ];
};

/* =========================
   선택한 날짜 key가 옵션 목록에 존재하는지 확인
   - key, fullKey, shortKey 중 하나라도 일치하면 true
========================= */
const isSameDateValue = (option, value) =>
  !!option &&
  !!value &&
  (option.key === value || option.fullKey === value || option.shortKey === value);

/* =========================
   메인 훅
   - 실제 화면에서 import해서 쓰는 부분
   - 사용법: const { activeTab, handleTabChange, ... } = useEmotionReport();
========================= */
function useEmotionReport() {
  /* =========================
     [API 연결 위치]
     - 지금은 더미 데이터를 직접 넣고 있음
     - 서버 연결할 때 이 한 줄만 바꾸면 됨
     *
     * 예시:
     * const { data: apiData } = useFetch('/api/report/emotion');
     * const rawReportData = apiData ?? FALLBACK_REPORT_DATA;
  ========================= */
  const rawReportData = FALLBACK_REPORT_DATA;

  /* =========================
     전체 데이터 안전하게 확보
     - rawReportData가 비어 있으면 더미 데이터 사용
  ========================= */
  const reportData = useMemo(
    () =>
      rawReportData && Object.keys(rawReportData).length > 0
        ? rawReportData
        : FALLBACK_REPORT_DATA,
    [rawReportData]
  );

  /* =========================
     감정 리포트 탭 데이터
     - EmotionTab 컴포넌트에 넘겨줄 데이터
  ========================= */
  const emotionTabData = useMemo(
    () => reportData?.emotionTab ?? FALLBACK_REPORT_DATA.emotionTab,
    [reportData]
  );

  /* =========================
     대화 히스토리 탭 데이터
     - ChatHistoryTab 컴포넌트에 넘겨줄 데이터
  ========================= */
  const chatHistoryTabData = useMemo(
    () => reportData?.chatHistoryTab ?? FALLBACK_REPORT_DATA.chatHistoryTab,
    [reportData]
  );

  /* =========================
     히스토리 개요 데이터
     - 히스토리 탭 상단 요약 카드용
  ========================= */
  const historyOverview = useMemo(
    () => reportData?.historyOverview ?? FALLBACK_REPORT_DATA.historyOverview,
    [reportData]
  );

  /* =========================
     탭 / 기간 / 봇 / 날짜 옵션 목록 정리
     - 서버 데이터에 목록이 있으면 그걸 사용
     - 없으면 기본값 사용
  ========================= */
  const tabOptions = useMemo(
    () =>
      Array.isArray(reportData?.tabOptions) && reportData.tabOptions.length > 0
        ? reportData.tabOptions
        : DEFAULT_TAB_OPTIONS,
    [reportData]
  );

  const periodOptions = useMemo(
    () =>
      Array.isArray(reportData?.periodOptions) && reportData.periodOptions.length > 0
        ? reportData.periodOptions
        : DEFAULT_PERIOD_OPTIONS,
    [reportData]
  );

  /* --- 봇 목록: 여러 소스에서 합치되, key 중복은 제거 --- */
  const botOptions = useMemo(
    () =>
      mergeUniqueByKey([
        ...(Array.isArray(reportData?.heroBots) ? reportData.heroBots : []),
        ...(Array.isArray(emotionTabData?.heroBots) ? emotionTabData.heroBots : []),
        ...(Array.isArray(chatHistoryTabData?.heroBots) ? chatHistoryTabData.heroBots : []),
        ...FALLBACK_HERO_BOTS,
      ]),
    [reportData, emotionTabData, chatHistoryTabData]
  );

  /* --- 날짜 목록 --- */
  const chatDateOptions = useMemo(
    () => normalizeDateOptions(chatHistoryTabData),
    [chatHistoryTabData]
  );

  /* =========================
     기본 선택값
     - 화면이 처음 열렸을 때 어떤 값이 선택되어야 하는지
  ========================= */
  const defaultActiveTab = getOptionKey(tabOptions[0]) || 'emotion';
  const defaultPeriod = getOptionKey(periodOptions[1]) || getOptionKey(periodOptions[0]) || '30d';
  const defaultBotKey = getOptionKey(botOptions[0]) || 'cat';
  const defaultDate = chatDateOptions[0]?.key || '';

  /* =========================
     실제 선택 상태 (useState)
     - 화면에서 사용자가 버튼을 클릭하면 이 값들이 바뀜
  ========================= */
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [selectedBotKey, setSelectedBotKey] = useState(defaultBotKey);
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  /* =========================
     선택값 유효성 검사 (useEffect)
     - 데이터가 바뀌었을 때, 현재 선택값이 유효한지 확인
     - 유효하지 않으면(예: 선택한 탭이 목록에 없으면) 기본값으로 되돌림
     *
     * [왜 필요한가?]
     * - 서버에서 새 데이터를 받으면 옵션 목록이 달라질 수 있음
     * - 그때 선택된 값이 새 목록에 없으면 화면이 깨질 수 있음
  ========================= */

  /* --- 탭 유효성 --- */
  useEffect(() => {
    const valid = tabOptions.some((item) => getOptionKey(item) === activeTab);
    if (!valid) setActiveTab(defaultActiveTab);
  }, [tabOptions, activeTab, defaultActiveTab]);

  /* --- 기간 유효성 --- */
  useEffect(() => {
    const valid = periodOptions.some((item) => getOptionKey(item) === selectedPeriod);
    if (!valid) setSelectedPeriod(defaultPeriod);
  }, [periodOptions, selectedPeriod, defaultPeriod]);

  /* --- 봇 유효성 --- */
  useEffect(() => {
    if (!botOptions.length) {
      if (selectedBotKey !== '') setSelectedBotKey('');
      return;
    }

    const valid = botOptions.some((item) => getOptionKey(item) === selectedBotKey);
    if (!valid) setSelectedBotKey(defaultBotKey);
  }, [botOptions, selectedBotKey, defaultBotKey]);

  /* --- 날짜 유효성 --- */
  useEffect(() => {
    if (!chatDateOptions.length) {
      if (selectedDate !== '') setSelectedDate('');
      return;
    }

    const valid = chatDateOptions.some((item) => isSameDateValue(item, selectedDate));
    if (!valid) setSelectedDate(defaultDate);
  }, [chatDateOptions, selectedDate, defaultDate]);

  /* =========================
     선택값 변경 함수
     - 컴포넌트에서 onClick / onChange에 연결해서 사용
     *
     * 사용 예시:
     * <button onClick={() => handleTabChange('history')}>대화 히스토리</button>
     * <button onClick={() => handlePeriodChange('7d')}>최근 7일</button>
  ========================= */
  const handleTabChange = useCallback((nextKey) => {
    setActiveTab(nextKey);
  }, []);

  const handlePeriodChange = useCallback((nextKey) => {
    setSelectedPeriod(nextKey);
  }, []);

  const handleBotChange = useCallback((nextKey) => {
    setSelectedBotKey(nextKey);
  }, []);

  const handleDateChange = useCallback((nextKey) => {
    setSelectedDate(nextKey);
  }, []);

  /* =========================
     바깥으로 내보내는 값들
     - 이 훅을 사용하는 컴포넌트에서 필요한 것만 골라서 꺼내 씀
     *
     * 사용 예시:
     * const { activeTab, selectedPeriod, handleTabChange } = useEmotionReport();
  ========================= */
  return {
    /* --- 현재 선택된 값들 --- */
    activeTab,
    selectedPeriod,
    selectedBotKey,
    selectedDate,

    /* --- 선택 가능한 옵션 목록들 --- */
    tabOptions,
    periodOptions,
    botOptions,

    /* --- 실제 데이터 --- */
    reportData,
    emotionTabData,
    chatHistoryTabData,
    historyOverview,

    /* --- 선택 변경 함수 (컴포넌트에서 onClick에 연결) --- */
    handleTabChange,
    handlePeriodChange,
    handleBotChange,
    handleDateChange,

    /* --- 직접 상태를 바꿔야 할 때 (보통은 위 handler를 사용) --- */
    setActiveTab,
    setSelectedPeriod,
    setSelectedBotKey,
    setSelectedDate,
  };
}

export default useEmotionReport;
