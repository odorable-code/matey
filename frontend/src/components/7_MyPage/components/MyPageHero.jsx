import React, { useMemo } from 'react';

const toArray = (value) => (Array.isArray(value) ? value : []);

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(toNumber(value, 0));
const formatPoints = (value) => `${formatNumber(value)}P`;

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
};

const toDisplayText = (value, fallback = '-') => {
  if (value === undefined || value === null || value === '') return fallback;

  if (typeof value === 'object') {
    return String(
      pickFirst(value.label, value.name, value.title, value.value, fallback)
    );
  }

  return String(value);
};

function MyPageHero({
  tabs = [],
  activeTab = 'overview',
  onTabChange,
  displayName = 'Matey 사용자',
  description = '',
  profile = {},
  avatarText = 'M',
  stats = [],
  totalSessions = 0,
  points = 0,
  recentEmotion = '안정',
  subscription = 'Premium Care',
  recentSession = null,
}) {
  const safeTabs = useMemo(() => toArray(tabs), [tabs]);

  const safeStats = useMemo(() => {
    const items = toArray(stats)
      .map((item, index) => ({
        id: pickFirst(item?.id, item?.key, `hero-stat-${index}`),
        label: pickFirst(item?.label, `항목 ${index + 1}`),
        value: toDisplayText(item?.value, '-'),
      }))
      .filter((item) => item.label);

    if (items.length > 0) return items.slice(0, 4);

    return [
      { id: 'subscription', label: '현재 플랜', value: toDisplayText(subscription || 'Premium Care') },
      { id: 'points', label: '포인트', value: formatPoints(points) },
      { id: 'emotion', label: '최근 감정', value: toDisplayText(recentEmotion || '안정') },
      { id: 'sessions', label: '누적 상담', value: `${formatNumber(totalSessions)}회` },
    ];
  }, [stats, subscription, points, recentEmotion, totalSessions]);

  const greeting = useMemo(() => {
    const nickname = pickFirst(
      profile?.nickname,
      profile?.name,
      profile?.userName,
      profile?.username,
      profile?.displayName,
      displayName,
      'Matey 사용자'
    );

    return `${nickname}님, 오늘도 차분하게 살펴볼게요`;
  }, [profile, displayName]);

  const helperText = useMemo(() => {
    if (description) return toDisplayText(description, '');

    if (recentSession?.title) {
      return `최근 상담 주제는 "${recentSession.title}"이며, 현재 감정 흐름은 ${toDisplayText(
        recentEmotion,
        '안정'
      )} 중심으로 정리되고 있어요.`;
    }

    return '상담 기록, 감정 리포트, 포인트와 설정 상태를 한 화면에서 편안하게 확인할 수 있어요.';
  }, [description, recentSession, recentEmotion]);

  const profileSubText = useMemo(() => {
    const latestDate = formatDate(
      pickFirst(recentSession?.date, recentSession?.createdAt, profile?.updatedAt, '')
    );

    if (recentSession?.title && latestDate) {
      return `${latestDate} · ${recentSession.title}`;
    }

    if (recentSession?.title) {
      return `최근 상담 · ${recentSession.title}`;
    }

    if (latestDate) {
      return `최근 활동 · ${latestDate}`;
    }

    return pickFirst(profile?.email, 'AI 상담 대시보드');
  }, [recentSession, profile]);

  const handleTabClick = (tabKey) => {
    if (typeof onTabChange === 'function') {
      onTabChange(tabKey);
    }
  };

  return (
    <section className="matey-mypage__hero">
      <div className="matey-mypage__hero-copy">
        <span className="matey-mypage__eyebrow">My Page</span>
        <h1>{toDisplayText(greeting, 'Matey 사용자')}</h1>
        <p>{toDisplayText(helperText, '')}</p>

        <div className="matey-mypage__hero-actions">
          {safeTabs.map((tab) => {
            const key = pickFirst(tab?.key, tab?.id, '');
            const label = pickFirst(tab?.label, tab?.title, key);

            if (!key || !label) return null;

            return (
              <button
                key={key}
                type="button"
                className={`matey-mypage__tab-chip ${activeTab === key ? 'is-active' : ''}`}
                onClick={() => handleTabClick(key)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="matey-mypage__hero-card">
        <div className="matey-mypage__profile-head">
          <div className="matey-mypage__avatar" aria-hidden="true">
            {toDisplayText(avatarText, 'M')}
          </div>

          <div>
            <strong>{toDisplayText(displayName, 'Matey 사용자')}</strong>
            <span>{toDisplayText(profileSubText, 'AI 상담 대시보드')}</span>
          </div>
        </div>

        <div className="matey-mypage__summary-grid">
          {safeStats.map((item) => (
            <article key={item.id} className="matey-mypage__summary-item">
              <span>{toDisplayText(item.label, '')}</span>
              <strong>{toDisplayText(item.value, '-')}</strong>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
}

export default React.memo(MyPageHero);
