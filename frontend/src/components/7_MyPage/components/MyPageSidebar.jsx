import React, { useMemo } from 'react';

const toArray = (value) => (Array.isArray(value) ? value : []);

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

function MyPageSidebar({
  tabs = [],
  activeTab = 'overview',
  onTabChange,
  profile = {},
  displayName = 'Matey 사용자',
  supportCount = 0,
  latestSupportStatus = '접수 가능',
  onLogout,
}) {
  const safeTabs = useMemo(() => {
    const items = toArray(tabs)
      .map((tab, index) => ({
        id: pickFirst(tab?.id, tab?.key, `tab-${index}`),
        key: pickFirst(tab?.key, tab?.id, ''),
        label: pickFirst(tab?.label, tab?.title, `메뉴 ${index + 1}`),
        description: pickFirst(tab?.description, ''),
      }))
      .filter((tab) => tab.key);

    if (items.length > 0) return items;

    return [
      {
        id: 'overview',
        key: 'overview',
        label: 'Home',
        description: '한눈에 보는 상담 현황과 핵심 요약',
      },
      {
        id: 'history',
        key: 'history',
        label: '상담내역',
        description: '최근 상담 기록과 대화 흐름',
      },
      {
        id: 'reports',
        key: 'reports',
        label: '감정리포트',
        description: '주간 감정 변화와 인사이트',
      },
      {
        id: 'billing',
        key: 'billing',
        label: '결제 · 포인트',
        description: '구독, 결제, 포인트 현황',
      },
      {
        id: 'settings',
        key: 'settings',
        label: '설정',
        description: '알림, 계정, 보안 설정',
      },
      {
        id: 'support',
        key: 'support',
        label: '지원',
        description: '문의 내역과 도움말',
      },
    ];
  }, [tabs]);

  const sidebarTitle = useMemo(() => {
    return pickFirst(
      profile?.nickname,
      profile?.name,
      profile?.userName,
      profile?.username,
      profile?.displayName,
      displayName,
      'Matey 사용자'
    );
  }, [profile, displayName]);

  const sidebarDescription = useMemo(() => {
    const count = toNumber(supportCount, 0);
    if (count > 0) {
      return `현재 문의 ${count}건 · 최근 상태 ${latestSupportStatus || '확인 필요'}`;
    }

    return `최근 상태 ${latestSupportStatus || '접수 가능'} · 필요할 때 바로 도움을 받을 수 있어요`;
  }, [supportCount, latestSupportStatus]);

  const handleTabClick = (tabKey) => {
    if (typeof onTabChange === 'function') {
      onTabChange(tabKey);
    }
  };

  const handleLogoutClick = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    }
  };

  return (
    <aside className="matey-mypage__sidebar">
      <nav aria-label="마이페이지 섹션 탐색">
        {safeTabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.id}
              type="button"
              className={`matey-mypage__sidebar-link ${isActive ? 'is-active' : ''}`}
              onClick={() => handleTabClick(tab.key)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{tab.label}</span>
              {tab.description ? <small>{tab.description}</small> : null}
            </button>
          );
        })}
      </nav>

      <div className="matey-mypage__sidebar-card">
        <strong>{sidebarTitle}</strong>
        <small
          style={{
            display: 'block',
            color: 'var(--matey-mypage-text-soft)',
            fontSize: '13px',
            lineHeight: 1.7,
            marginBottom: '6px',
          }}
        >
          {sidebarDescription}
        </small>

        <a
          href="#overview"
          onClick={(event) => {
            event.preventDefault();
            handleTabClick('overview');
          }}
        >
          홈으로 이동
        </a>

        <a
          href="#support"
          onClick={(event) => {
            event.preventDefault();
            handleTabClick('support');
          }}
        >
          문의 내역 보기
        </a>

        <button
          type="button"
          className="matey-mypage__logout-button"
          onClick={handleLogoutClick}
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}

export default React.memo(MyPageSidebar);
