import { useEffect, useMemo, useState } from 'react';
import { getEmotionReports } from '../../api/reportApi';

export const REPORT_TAB_OPTIONS = [
  { key: 'emotion', label: '감정 리포트' },
  { key: 'history', label: '대화 히스토리' },
];

export const REPORT_PERIOD_OPTIONS = [
  { key: '7d', label: '최근 7일' },
  { key: '30d', label: '최근 30일' },
  { key: '90d', label: '최근 90일' },
];

export const BOT_OPTIONS = [
  {
    key: 'cat',
    name: '냥이',
    typeLabel: '직설형 리포터',
    fallbackLabel: '냥',
    accentColor: '#9A85FF',
    softColor: '#F2ECFF',
    imageUrl: '',
    imagePath: '',
  },
  {
    key: 'bear',
    name: '곰이',
    typeLabel: '든든한 위로형',
    fallbackLabel: '곰',
    accentColor: '#F3A55C',
    softColor: '#FFF1E4',
    imageUrl: '',
    imagePath: '',
  },
  {
    key: 'dog',
    name: '강아지',
    typeLabel: '공감·응원형',
    fallbackLabel: '강',
    accentColor: '#7DBBF7',
    softColor: '#ECF6FF',
    imageUrl: '',
    imagePath: '',
  },
  {
    key: 'hamster',
    name: '햄이',
    typeLabel: '세심한 생활형',
    fallbackLabel: '햄',
    accentColor: '#C6A5FF',
    softColor: '#F4EEFF',
    imageUrl: '',
    imagePath: '',
  },
];

const HERO_REPORT_MAP = {
  cat: {
    title: '냥이 피드백',
    summary:
      '감정을 너무 크게 보기보다, 정확히 어디서 흔들렸는지부터 짚어야 해. 지금 필요한 건 예민함이 아니라 해석이야.',
    bullets: [
      '이 기간의 핵심 고민'
      // '결과 불안이 감정보다 먼저 몸집을 키우는 흐름이 보여.',
      // '비교가 시작되면 바로 자책으로 이어지는 연결이 자주 보여.',
      // '기준을 조금만 조절해도 전체 감정 흐름이 훨씬 가벼워질 수 있어.',
    ],
    chips: ['현실 점검', '자책 교정', '기준 재정비'],
  },
  bear: {
    title: '곰이 리포트',
    summary:
      '지친 날이 있어도 결국 다시 돌아오려는 힘이 보여. 지금은 더 잘하려 하기보다, 버티고 있는 마음을 먼저 안아줘야 해.',
    bullets: [
      '감정이 무거운 날에도 완전히 놓지 않고 다시 돌아오려는 힘이 있어.',
      '해결보다 안정이 먼저 필요한 날이 자주 보여.',
      '자기비판을 줄이면 회복 속도도 더 부드럽게 올라갈 가능성이 커.',
    ],
    chips: ['안정감', '버팀', '따뜻한 위로'],
  },
  dog: {
    title: '강아지 리포트',
    summary:
      '많이 힘든데도 계속 해보려는 마음이 남아 있어. 그래서 지금은 큰 결론보다 작은 실행 하나를 같이 잡아주는 게 중요해 보여.',
    bullets: [
      '불안이 올라와도 도움을 찾고 다시 움직이려는 흐름이 분명히 있어.',
      '혼자 다 해결하려 할수록 감정 부담이 더 커지는 장면이 보여.',
      '작은 계획으로 쪼개면 훨씬 덜 무겁게 시작할 수 있어.',
    ],
    chips: ['공감', '응원', '작은 실행'],
  },
  hamster: {
    title: '햄이 리포트',
    summary:
      '감정이 생활 리듬하고 같이 흔들리는 패턴이 보여. 마음을 한 번에 바꾸기보다 하루 루틴 하나를 잡는 게 더 효과적일 수 있어.',
    bullets: [
      '수면이나 일상 리듬이 흐트러진 날 감정 반응도 더 커지는 편이야.',
      '작은 루틴 하나만 안정돼도 전체 감정 흐름이 정돈될 수 있어.',
      '거창한 다짐보다 생활 단위의 작은 회복이 더 중요해 보여.',
    ],
    chips: ['루틴', '생활 정리', '잔잔한 회복'],
  },
};

const BOT_ANALYSIS_MAP = {
  cat: {
    stability: 82,
    recovery: 76,
    acceptance: 68,
    coreTitle: '불안과 자책이 반복되지만, 감정의 원인을 정확히 짚으려는 흐름도 보여요.',
    coreDescription:
      '결과 중심의 압박 때문에 스스로를 몰아붙이는 순간이 있었지만, 문제를 감정이 아닌 상황 구조로 보려는 시도도 함께 나타났어요.',
    flow: [
      { label: '불안', value: 72 },
      { label: '자책', value: 56 },
      { label: '정리', value: 49 },
      { label: '위로', value: 42 },
      { label: '집중', value: 36 },
    ],
    distribution: [
      { label: '불안', value: 34, color: '#9A85FF', description: '압박과 걱정이 높았던 구간' },
      { label: '안정', value: 24, color: '#7ED4C7', description: '스스로 정리된 흐름' },
      { label: '자책', value: 22, color: '#FF8DB3', description: '스스로를 몰아붙인 표현' },
      { label: '위로', value: 20, color: '#FFB38A', description: '회복을 찾는 감정 반응' },
    ],
    defaultTopics: ['시험', '비교', '자기기대', '불안', '자책'],
  },
  bear: {
    stability: 86,
    recovery: 81,
    acceptance: 78,
    coreTitle: '지친 마음이 자주 보였지만, 다시 버티고 일어나는 힘도 분명히 있어요.',
    coreDescription:
      '부담감이 반복되는 날에도 완전히 무너지기보다 다시 일상으로 돌아오려는 회복 흐름이 꾸준히 나타났어요.',
    flow: [
      { label: '위로', value: 68 },
      { label: '안정', value: 61 },
      { label: '불안', value: 48 },
      { label: '회복', value: 46 },
      { label: '자책', value: 33 },
    ],
    distribution: [
      { label: '안정', value: 31, color: '#7ED4C7', description: '감정이 정리된 구간' },
      { label: '위로', value: 29, color: '#F3A55C', description: '따뜻한 회복 흐름' },
      { label: '불안', value: 23, color: '#9A85FF', description: '걱정이 올라온 장면' },
      { label: '자책', value: 17, color: '#FF8DB3', description: '스스로에게 엄격했던 구간' },
    ],
    defaultTopics: ['위로', '버팀', '회복', '일상', '마음정리'],
  },
  dog: {
    stability: 79,
    recovery: 83,
    acceptance: 71,
    coreTitle: '마음이 흔들릴 때마다 도움을 찾고 다시 해보려는 의지가 분명히 보여요.',
    coreDescription:
      '힘들다고 느끼는 순간이 있어도 그대로 멈추기보다 해결 방법을 함께 찾으려는 흐름이 자주 등장했어요.',
    flow: [
      { label: '공감', value: 70 },
      { label: '불안', value: 55 },
      { label: '실행', value: 51 },
      { label: '안정', value: 47 },
      { label: '위로', value: 40 },
    ],
    distribution: [
      { label: '공감', value: 30, color: '#FF8DB3', description: '감정을 이해받고 싶은 흐름' },
      { label: '불안', value: 27, color: '#9A85FF', description: '걱정과 긴장이 올라온 구간' },
      { label: '안정', value: 23, color: '#7ED4C7', description: '다시 가라앉은 장면' },
      { label: '실행', value: 20, color: '#FFB38A', description: '해결책을 찾는 흐름' },
    ],
    defaultTopics: ['응원', '실행', '공감', '불안', '계획'],
  },
  hamster: {
    stability: 77,
    recovery: 74,
    acceptance: 73,
    coreTitle: '복잡한 감정이 생활 리듬과 연결되어 나타나는 패턴이 보여요.',
    coreDescription:
      '마음이 흔들릴 때 수면, 식사, 공부 루틴도 같이 영향을 받는 흐름이 보여서 작은 생활 단위 정리가 중요해 보여요.',
    flow: [
      { label: '루틴', value: 63 },
      { label: '불안', value: 52 },
      { label: '안정', value: 48 },
      { label: '회복', value: 41 },
      { label: '집중', value: 35 },
    ],
    distribution: [
      { label: '루틴', value: 28, color: '#F2C94C', description: '생활 리듬과 연결된 흐름' },
      { label: '불안', value: 26, color: '#9A85FF', description: '걱정이 올라온 구간' },
      { label: '안정', value: 24, color: '#7ED4C7', description: '정돈된 장면' },
      { label: '회복', value: 22, color: '#FFB38A', description: '잔잔히 나아진 흐름' },
    ],
    defaultTopics: ['루틴', '생활관리', '회복', '불안', '집중'],
  },
};

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getReferenceDate(dailyReports) {
  const keys = Object.keys(dailyReports);
  if (keys.length === 0) return new Date();
  const lastDateKey = keys.sort().slice(-1)[0];
  return lastDateKey ? parseDateKey(lastDateKey) : new Date();
}

function getDiffDays(baseDate, targetDate) {
  const diff = baseDate.getTime() - targetDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getPeriodDays(periodKey) {
  if (periodKey === '90d') return 90;
  if (periodKey === '30d') return 30;
  return 7;
}

function filterDailyReportsByPeriod(dailyReports, selectedPeriod) {
  if (!dailyReports || Object.keys(dailyReports).length === 0) return {};
  const maxDays = getPeriodDays(selectedPeriod);
  const referenceDate = getReferenceDate(dailyReports);

  return Object.entries(dailyReports)
    .filter(([dateKey]) => {
      const diffDays = getDiffDays(referenceDate, parseDateKey(dateKey));
      return diffDays >= 0 && diffDays < maxDays;
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [dateKey, value]) => {
      acc[dateKey] = value;
      return acc;
    }, {});
}

function getLastDateKey(dailyReports) {
  if (!dailyReports) return '';
  const keys = Object.keys(dailyReports).sort();
  return keys[keys.length - 1] || '';
}

function getTopTopics(filteredDailyReports, limit = 8) {
  const topicCounter = {};

  Object.values(filteredDailyReports).forEach((report) => {
    (report.dominantTopics || []).forEach((topic) => {
      topicCounter[topic] = (topicCounter[topic] || 0) + 1;
    });
  });

  return Object.entries(topicCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic]) => topic);
}

function getStrongestEmotion(filteredDailyReports) {
  const emotionCounter = {};

  Object.values(filteredDailyReports).forEach((report) => {
    const key = report.dominantEmotion || '감정';
    emotionCounter[key] = (emotionCounter[key] || 0) + 1;
  });

  const [topEmotion] =
    Object.entries(emotionCounter).sort((a, b) => b[1] - a[1])[0] || [];

  return topEmotion || '-';
}

function getMostActiveTimeRange(filteredDailyReports) {
  const counter = {};

  Object.values(filteredDailyReports).forEach((report) => {
    const range = report.activeTimeRange || '-';
    counter[range] = (counter[range] || 0) + 1;
  });

  const [topRange] =
    Object.entries(counter).sort((a, b) => b[1] - a[1])[0] || [];

  return topRange || '-';
}

function buildSummaryTimeline(filteredDailyReports) {
  return Object.values(filteredDailyReports)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, 3)
    .map((report, index) => ({
      id: index + 1,
      title: report.summaryTitle,
      description: report.mainConcern,
    }));
}

function buildHeroBots() {
  return BOT_OPTIONS.map((bot) => ({
    ...bot,
    ...HERO_REPORT_MAP[bot.key],
  }));
}

function buildEmotionTabData(selectedBot, filteredDailyReports) {
  const botAnalysis = BOT_ANALYSIS_MAP[selectedBot.key] || BOT_ANALYSIS_MAP.cat;
  const heroBots = buildHeroBots();
  const selectedHero =
    heroBots.find((hero) => hero.key === selectedBot.key) || heroBots[0];

  const topTopics = getTopTopics(filteredDailyReports);
  const totalConversations = Object.values(filteredDailyReports).reduce(
    (sum, report) => sum + (report.conversationCount || 0),
    0
  );

  const latestTimeline = buildSummaryTimeline(filteredDailyReports);

  return {
    heroBots,
    selectedHero,
    statCards: [
      {
        id: 'conversation-count',
        label: '함께 마음 나눈 날들',
        value: `${totalConversations}회`,
        caption: '선택 기간 동안 기록된 대화 날짜 횟수',
      },
      {
        id: 'stability',
        label: '안정도',
        value: `${botAnalysis.stability}%`,
        caption: '감정이 급격히 무너지지 않은 흐름',
      },
      {
        id: 'recovery',
        label: '회복도',
        value: `${botAnalysis.recovery}%`,
        caption: '감정이 다시 정리되는 힘',
      },
      {
        id: 'acceptance',
        label: '자기수용',
        value: `${botAnalysis.acceptance}%`,
        caption: '자책보다 수용으로 이동한 흐름',
      },
    ],
    coreEmotion: {
      title: botAnalysis.coreTitle,
      description: botAnalysis.coreDescription,
      tags: topTopics.length ? topTopics.slice(0, 4) : botAnalysis.defaultTopics,
    },
    emotionDistribution: {
      total: totalConversations || 0,
      items: botAnalysis.distribution,
    },
    emotionFlow: botAnalysis.flow,
    topicTags: topTopics.length ? topTopics : botAnalysis.defaultTopics,
    summaryTimeline:
      latestTimeline.length > 0
        ? latestTimeline
        : [
            {
              id: 1,
              title: '시험: '
              // description: '대화 기록이 더 쌓이면 여기서 감정 흐름을 더 풍부하게 보여줄 수 있어요.',
            },
          ],
  };
}

function buildHistoryOverview(filteredDailyReports) {
  const dateCount = Object.keys(filteredDailyReports).length;

  return {
    conversationCount: `${dateCount}일`,
    strongestEmotion: getStrongestEmotion(filteredDailyReports),
    activeTimeRange: getMostActiveTimeRange(filteredDailyReports),
    latestDateKey: getLastDateKey(filteredDailyReports),
  };
}

function useEmotionReport() {
  const [dailyReportsData, setDailyReportsData] = useState({});
  const [botHistoryReportsData, setBotHistoryReportsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('emotion');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedBotKey, setSelectedBotKey] = useState('cat');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await getEmotionReports();
        if (response && response.data) {
          setDailyReportsData(response.data.dailyReports || {});
          setBotHistoryReportsData(response.data.botHistoryReports || {});
          const defaultDate = getLastDateKey(response.data.dailyReports || {});
          setSelectedDate(defaultDate);
        }
      } catch (error) {
        console.error('Failed to fetch emotion reports:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDailyReports = useMemo(
    () => filterDailyReportsByPeriod(dailyReportsData, selectedPeriod),
    [dailyReportsData, selectedPeriod]
  );

  useEffect(() => {
    if (!filteredDailyReports[selectedDate] && Object.keys(filteredDailyReports).length > 0) {
      setSelectedDate(getLastDateKey(filteredDailyReports));
    }
  }, [filteredDailyReports, selectedDate]);

  const selectedBot = useMemo(
    () => BOT_OPTIONS.find((bot) => bot.key === selectedBotKey) || BOT_OPTIONS[0],
    [selectedBotKey]
  );

  const botMeta = useMemo(
    () =>
      BOT_OPTIONS.reduce((acc, bot) => {
        acc[bot.key] = bot;
        return acc;
      }, {}),
    []
  );

  const emotionTabData = useMemo(
    () => buildEmotionTabData(selectedBot, filteredDailyReports),
    [selectedBot, filteredDailyReports]
  );

  const historyOverview = useMemo(
    () => buildHistoryOverview(filteredDailyReports),
    [filteredDailyReports]
  );

  const chatHistoryTabData = useMemo(
    () => ({
      selectedDate,
      selectedBotKey,
      dailyReports: filteredDailyReports,
      botReports: botHistoryReportsData,
      botMeta,
      overview: historyOverview,
    }),
    [selectedDate, selectedBotKey, filteredDailyReports, botHistoryReportsData, botMeta, historyOverview]
  );

  const reportData = useMemo(
    () => ({
      activeTab,
      selectedPeriod,
      selectedBotKey,
      selectedDate,
      emotionTab: emotionTabData,
      chatHistoryTab: chatHistoryTabData,
      chatHistoryTabData,
    }),
    [
      activeTab,
      selectedPeriod,
      selectedBotKey,
      selectedDate,
      emotionTabData,
      chatHistoryTabData,
    ]
  );

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
  };

  const handlePeriodChange = (periodKey) => {
    setSelectedPeriod(periodKey);
  };

  const handleBotChange = (botKey) => {
    setSelectedBotKey(botKey);
  };

  const handleDateChange = (dateKey) => {
    setSelectedDate(dateKey);
  };

  return {
    isLoading,
    activeTab,
    selectedPeriod,
    selectedBotKey,
    selectedBot,
    selectedDate,
    tabOptions: REPORT_TAB_OPTIONS,
    periodOptions: REPORT_PERIOD_OPTIONS,
    botOptions: BOT_OPTIONS,
    reportData,
    emotionTabData,
    chatHistoryTabData,
    historyOverview,
    handleTabChange,
    handlePeriodChange,
    handleBotChange,
    handleDateChange,
    setActiveTab,
    setSelectedPeriod,
    setSelectedBotKey,
    setSelectedDate,
  };
}

export default useEmotionReport;
