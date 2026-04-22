import React, { useEffect, useMemo, useState } from 'react';
import './MyPage.css';

import * as MyPageHeroModule from './components/MyPageHero';
import * as MyPageSidebarModule from './components/MyPageSidebar';

import * as MyPageOverviewSectionModule from './sections/MyPageOverviewSection';
import * as MyPageHistorySectionModule from './sections/MyPageHistorySection';
import * as MyPageReportsSectionModule from './sections/MyPageReportsSection';
import * as MyPageBillingSectionModule from './sections/MyPageBillingSection';
import * as MyPageSettingsSectionModule from './sections/MyPageSettingsSection';
import * as MyPageSupportSectionModule from './sections/MyPageSupportSection';

import useMyProfile from './hooks/useMyProfile';
import useCounselHistory from './hooks/useCounselHistory';
import useEmotionReports from './hooks/useEmotionReports';
import useBillingInfo from './hooks/useBillingInfo';
import useSupportHistory from './hooks/useSupportHistory';

const MyPageHero = MyPageHeroModule.default || MyPageHeroModule;
const MyPageSidebar = MyPageSidebarModule.default || MyPageSidebarModule;

const MyPageOverviewSection =
  MyPageOverviewSectionModule.default || MyPageOverviewSectionModule;
const MyPageHistorySection =
  MyPageHistorySectionModule.default || MyPageHistorySectionModule;
const MyPageReportsSection =
  MyPageReportsSectionModule.default || MyPageReportsSectionModule;
const MyPageBillingSection =
  MyPageBillingSectionModule.default || MyPageBillingSectionModule;
const MyPageSettingsSection =
  MyPageSettingsSectionModule.default || MyPageSettingsSectionModule;
const MyPageSupportSection =
  MyPageSupportSectionModule.default || MyPageSupportSectionModule;

const TAB_ITEMS = [
  {
    key: 'overview',
    label: 'Home',
    title: '홈',
    description: '한눈에 보는 상담 현황과 핵심 요약',
  },
  {
    key: 'history',
    label: '상담내역',
    title: '상담내역',
    description: '최근 상담 기록과 대화 흐름',
  },
  {
    key: 'reports',
    label: '감정리포트',
    title: '감정리포트',
    description: '주간 감정 변화와 인사이트',
  },
  {
    key: 'billing',
    label: '결제 · 포인트',
    title: '결제 · 포인트',
    description: '구독, 결제, 포인트 현황',
  },
  {
    key: 'settings',
    label: '설정',
    title: '설정',
    description: '알림, 계정, 보안 설정',
  },
  {
    key: 'support',
    label: '지원',
    title: '지원',
    description: '문의 내역과 도움말',
  },
];

const toArray = (value) => (Array.isArray(value) ? value : []);
const toObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(toNumber(value, 0));
const formatPoints = (value) => `${formatNumber(value)}P`;

const getHookPayload = (hookValue) => {
  if (Array.isArray(hookValue)) {
    return {
      data: hookValue[0] ?? {},
      actions: hookValue[1] ?? {},
    };
  }

  return toObject(hookValue);
};

const getDisplayName = (profile) =>
  pickFirst(
    profile?.nickname,
    profile?.name,
    profile?.userName,
    profile?.username,
    profile?.displayName,
    'Matey 사용자'
  );

const getInitial = (name) => {
  const text = String(name || '').trim();
  return text ? text.charAt(0).toUpperCase() : 'M';
};

const getStatusText = (profile, billing) =>
  pickFirst(
    billing?.subscriptionName,
    billing?.planName,
    billing?.plan?.name,
    profile?.subscriptionName,
    profile?.membership,
    profile?.status,
    'Premium Care'
  );

const getPointsValue = (profile, billing) =>
  pickFirst(
    billing?.availablePoints,
    billing?.points,
    billing?.pointBalance,
    profile?.points,
    0
  );

const getTotalSessions = (profile, history, reports) =>
  toNumber(
    pickFirst(
      history?.totalCount,
      history?.total,
      history?.count,
      profile?.totalSessions,
      profile?.sessionCount,
      reports?.totalSessions,
      toArray(history?.items).length,
      toArray(history?.history).length,
      0
    ),
    0
  );

const getRecentSessions = (history) => {
  const list = toArray(
    pickFirst(history?.items, history?.history, history?.sessions, history?.data, [])
  );

  return list.map((item, index) => ({
    id: pickFirst(item?.id, item?.sessionId, item?.counselId, `session-${index}`),
    title: pickFirst(item?.title, item?.topic, item?.subject, '상담 기록'),
    summary: pickFirst(
      item?.summary,
      item?.preview,
      item?.description,
      item?.lastMessage,
      '최근 상담 내용이 여기에 표시됩니다.'
    ),
    mood: pickFirst(item?.mood, item?.emotion, item?.statusLabel, '안정'),
    date: pickFirst(item?.date, item?.createdAt, item?.startedAt, item?.time, ''),
    counselor: pickFirst(item?.botName, item?.assistantName, item?.counselor, 'Matey AI'),
  }));
};

const getEmotionLabel = (value) => {
  if (value && typeof value === 'object') {
    return pickFirst(value.label, value.name, value.emotion, '안정');
  }

  return pickFirst(value, '안정');
};

const getEmotionSummary = (reports) => {
  const emotionBars = toArray(
    pickFirst(
      reports?.emotionBars,
      reports?.emotions,
      reports?.weeklyEmotions,
      reports?.chartData,
      []
    )
  );

  const topEmotion =
    emotionBars
      .map((item) => ({
        label: pickFirst(item?.label, item?.name, item?.emotion, ''),
        value: toNumber(pickFirst(item?.value, item?.percent, item?.score), 0),
      }))
      .sort((a, b) => b.value - a.value)[0] || {};

  return {
    dominantEmotion: getEmotionLabel(
      pickFirst(
        reports?.dominantEmotion,
        reports?.summary?.dominantEmotion,
        topEmotion?.label,
        '안정'
      )
    ),
    stability: toNumber(
      pickFirst(
        reports?.stability,
        reports?.stabilityScore,
        reports?.summary?.stability,
        reports?.summary?.stabilityScore,
        76
      ),
      76
    ),
  };
};

const getSupportSummary = (support) => {
  const items = toArray(
    pickFirst(support?.items, support?.history, support?.tickets, support?.data, [])
  );

  return {
    count: toNumber(
      pickFirst(support?.totalCount, support?.count, items.length, 0),
      items.length || 0
    ),
    latestStatus: pickFirst(items[0]?.status, support?.latestStatus, '접수 가능'),
  };
};

const getBillingSummary = (billing) => {
  const payments = toArray(
    pickFirst(billing?.payments, billing?.paymentHistory, billing?.billingHistory, [])
  );

  return {
    subscription: getStatusText({}, billing),
    nextBillingDate: pickFirst(
      billing?.nextBillingDate,
      billing?.renewalDate,
      billing?.subscription?.nextBillingDate,
      ''
    ),
    payments,
  };
};

const isLoadingFlag = (value) => Boolean(value && typeof value === 'boolean' && value);
const isErrorValue = (value) => Boolean(value);

function MyPage() {
  const profileHook = getHookPayload(useMyProfile());
  const historyHook = getHookPayload(useCounselHistory());
  const reportsHook = getHookPayload(useEmotionReports());
  const billingHook = getHookPayload(useBillingInfo());
  const supportHook = getHookPayload(useSupportHistory());

  const profile = useMemo(
    () =>
      toObject(
        pickFirst(
          profileHook?.profile,
          profileHook?.data,
          profileHook?.user,
          profileHook?.result,
          {}
        )
      ),
    [profileHook]
  );

  const history = useMemo(
    () =>
      toObject(
        pickFirst(
          historyHook?.history,
          historyHook?.data,
          historyHook?.result,
          historyHook,
          {}
        )
      ),
    [historyHook]
  );

  const reports = useMemo(
    () =>
      toObject(
        pickFirst(
          reportsHook?.reports,
          reportsHook?.report,
          reportsHook?.data,
          reportsHook?.result,
          reportsHook,
          {}
        )
      ),
    [reportsHook]
  );

  const billing = useMemo(
    () =>
      toObject(
        pickFirst(
          billingHook?.billing,
          billingHook?.data,
          billingHook?.result,
          billingHook,
          {}
        )
      ),
    [billingHook]
  );

  const support = useMemo(
    () =>
      toObject(
        pickFirst(
          supportHook?.support,
          supportHook?.data,
          supportHook?.result,
          supportHook,
          {}
        )
      ),
    [supportHook]
  );

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'overview';
    const hash = window.location.hash.replace('#', '').trim();
    return TAB_ITEMS.some((tab) => tab.key === hash) ? hash : 'overview';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentHash = window.location.hash.replace('#', '').trim();
    if (currentHash !== activeTab) {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  const loading = useMemo(
    () =>
      [
        profileHook?.loading,
        historyHook?.loading,
        reportsHook?.loading,
        billingHook?.loading,
        supportHook?.loading,
      ].some(isLoadingFlag),
    [profileHook, historyHook, reportsHook, billingHook, supportHook]
  );

  const errorMessage = useMemo(() => {
    const error =
      profileHook?.error ||
      historyHook?.error ||
      reportsHook?.error ||
      billingHook?.error ||
      supportHook?.error ||
      null;

    if (!isErrorValue(error)) return '';

    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object') {
      return pickFirst(error?.message, error?.error, '데이터를 불러오는 중 문제가 발생했습니다.');
    }

    return '데이터를 불러오는 중 문제가 발생했습니다.';
  }, [profileHook, historyHook, reportsHook, billingHook, supportHook]);

  const recentSessions = useMemo(() => getRecentSessions(history), [history]);
  const emotionSummary = useMemo(() => getEmotionSummary(reports), [reports]);
  const supportSummary = useMemo(() => getSupportSummary(support), [support]);
  const billingSummary = useMemo(() => getBillingSummary(billing), [billing]);

  const displayName = useMemo(() => getDisplayName(profile), [profile]);
  const avatarText = useMemo(() => getInitial(displayName), [displayName]);

  const heroStats = useMemo(
    () => [
      {
        label: '현재 플랜',
        value: String(billingSummary.subscription || 'Premium Care'),
      },
      {
        label: '포인트',
        value: formatPoints(getPointsValue(profile, billing)),
      },
      {
        label: '최근 감정',
        value: String(getEmotionLabel(emotionSummary.dominantEmotion)),
      },
      {
        label: '누적 상담',
        value: `${formatNumber(getTotalSessions(profile, history, reports))}회`,
      },
    ],
    [billingSummary, profile, billing, emotionSummary, history, reports]
  );

  const heroDescription = useMemo(() => {
    const latestSession = recentSessions[0];
    const normalizedEmotion = getEmotionLabel(emotionSummary.dominantEmotion);

    if (latestSession?.title) {
      return `${displayName}님의 최근 상담 주제는 "${latestSession.title}"이며, 현재 주요 감정 흐름은 ${normalizedEmotion} 중심으로 보이고 있어요.`;
    }

    return `${displayName}님의 상담 기록, 감정 리포트, 결제 상태와 지원 내역을 한 화면에서 정리해 드려요.`;
  }, [displayName, recentSessions, emotionSummary]);

  const sharedSectionProps = useMemo(
    () => ({
      profile,
      history,
      reports,
      billing,
      support,
      recentSessions,
      heroStats,
      displayName,
      loading,
      errorMessage,
    }),
    [
      profile,
      history,
      reports,
      billing,
      support,
      recentSessions,
      heroStats,
      displayName,
      loading,
      errorMessage,
    ]
  );

  const handleTabChange = (nextTab) => {
    if (!TAB_ITEMS.some((tab) => tab.key === nextTab)) return;
    setActiveTab(nextTab);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (error) {
      window.location.href = '/';
    }
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'history':
        return <MyPageHistorySection {...sharedSectionProps} />;

      case 'reports':
        return <MyPageReportsSection {...sharedSectionProps} />;

      case 'billing':
        return <MyPageBillingSection {...sharedSectionProps} />;

      case 'settings':
        return <MyPageSettingsSection {...sharedSectionProps} />;

      case 'support':
        return <MyPageSupportSection {...sharedSectionProps} />;

      case 'overview':
      default:
        return <MyPageOverviewSection {...sharedSectionProps} />;
    }
  };

  return (
    <div className="matey-mypage">
      <MyPageHero
        tabs={TAB_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        displayName={displayName}
        description={heroDescription}
        profile={profile}
        avatarText={avatarText}
        stats={heroStats}
        totalSessions={getTotalSessions(profile, history, reports)}
        points={getPointsValue(profile, billing)}
        recentEmotion={getEmotionLabel(emotionSummary.dominantEmotion)}
        subscription={billingSummary.subscription}
        recentSession={recentSessions[0] || null}
      />

      <div className="matey-mypage__content">
        <MyPageSidebar
          tabs={TAB_ITEMS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          profile={profile}
          displayName={displayName}
          supportCount={supportSummary.count}
          latestSupportStatus={supportSummary.latestStatus}
          onLogout={handleLogout}
        />

        <main className="matey-mypage__main" key={activeTab}>
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

export default MyPage;
