import React, { useEffect, useMemo, useRef, useState } from 'react';
import layoutStyles from '../layout/MyPageLayout.module.css';

import ProfileCard from '../layout/ProfileCard';
import SideMenu from '../layout/SideMenu';

import DashboardContent from '../contents/DashboardContent';
import ProfileInfoContent from '../contents/ProfileInfoContent';
import EmotionReportContent from '../contents/emotionReport/EmotionReportContent';
import BotMenuContent from '../contents/BotMenuContent';
import LetterBoxContent from '../contents/letterBox/LetterBoxContent';
import SettingsContent from '../contents/settings/SettingsContent';

function MyPageContainer() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [transitionKey, setTransitionKey] = useState(0);
  const contentPanelRef = useRef(null);

  const menuItems = useMemo(
    () => [
      {
        key: 'dashboard',
        label: '대시보드',
        description: '메이티와의 오늘 상태를 확인해요',
      },
      {
        key: 'profileInfo',
        label: '프로필 정보',
        description: '내 프로필과 계정 정보를 수정해요',
      },
      {
        key: 'emotionReport',
        label: '감정 리포트',
        description: '대화 기반 감정 흐름을 확인해요',
      },
      {
        key: 'botMenu',
        label: '메이티 정보',
        description: '레벨, 포인트, 수집 현황을 살펴봐요',
      },
      {
        key: 'letterBox',
        label: '편지함',
        description: '도착한 편지와 읽지 않은 편지를 봐요',
      },
      {
        key: 'settings',
        label: '설정',
        description: '알림과 서비스 옵션을 관리해요',
      },
    ],
    []
  );

  const handleMenuSelect = (menuKey) => {
    if (menuKey === activeMenu) return;
    setActiveMenu(menuKey);
    setTransitionKey((prev) => prev + 1);
  };

  const handleInteractionSelect = () => {
    if (activeMenu !== 'botMenu') {
      setActiveMenu('botMenu');
      setTransitionKey((prev) => prev + 1);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'profileInfo':
        return <ProfileInfoContent />;

      case 'emotionReport':
        return <EmotionReportContent />;

      case 'botMenu':
        return <BotMenuContent />;

      case 'letterBox':
        return <LetterBoxContent />;

      case 'settings':
        return <SettingsContent />;

      // activeMenu가 'dashboard'일 때와 그 외의 정의되지 않은 모든 값일 때 해당 내용을 실행
      case 'dashboard':
      default:
        return (
          <DashboardContent
            onInteractionSelect={handleInteractionSelect}
            intimacyLevel={4}
            intimacyExp={18}
            intimacyMaxExp={100}
          />
        );
    }
  };

  useEffect(() => {
    const root = contentPanelRef.current;
    if (!root) return undefined;

    let rafId = 0;

    const applyRevealItems = () => {
      const previousItems = root.querySelectorAll('[data-reveal-item="true"]');

      previousItems.forEach((node) => {
        node.removeAttribute('data-reveal-item');
        node.style.removeProperty('--reveal-index');
      });

      const candidates = Array.from(
        root.querySelectorAll('article, [class*="Card"], [class*="card"]')
      ).filter((element) => {
        if (!(element instanceof HTMLElement)) return false;

        const rect = element.getBoundingClientRect();
        if (rect.width < 140 || rect.height < 72) return false;
        if (element.dataset.revealSkip === 'true') return false;

        return true;
      });

      const selected = [];

      candidates.forEach((element) => {
        const isNestedInsideSelected = selected.some((parent) =>
          parent.contains(element)
        );

        if (!isNestedInsideSelected) {
          selected.push(element);
        }
      });

      selected.slice(0, 12).forEach((element, index) => {
        element.setAttribute('data-reveal-item', 'true');
        element.style.setProperty('--reveal-index', String(index));
      });
    };

    rafId = window.requestAnimationFrame(() => {
      applyRevealItems();
    });

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [activeMenu, transitionKey]);

  return (
    <div className={layoutStyles.page}>
      <div className={layoutStyles.container}>
        <aside className={layoutStyles.sidebarColumn}>
          <ProfileCard />

          <SideMenu
            items={menuItems}
            activeKey={activeMenu}
            onSelect={handleMenuSelect}
          />
        </aside>

        <main className={layoutStyles.contentColumn}>
          <section
            key={`${activeMenu}-${transitionKey}`}
            ref={contentPanelRef}
            className={layoutStyles.contentPanel}
            data-panel-enter="true"
          >
            <div className={layoutStyles.contentInner}>{renderContent()}</div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default MyPageContainer;
