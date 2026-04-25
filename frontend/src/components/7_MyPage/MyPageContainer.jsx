import React, { useEffect, useMemo, useRef, useState } from 'react';
import layoutStyles from './layout/MyPageLayout.module.css';

import ProfileCard from './ProfileCard';
import SideMenu from './SideMenu';

import DashboardContent from './contents/DashboardContent';
import ProfileInfoContent from './contents/ProfileInfoContent';
import EmotionReportContent from './contents/EmotionReportContent';
import BotMenuContent from './contents/BotMenuContent';
import LetterBoxContent from './contents/LetterBoxContent';
import SettingsContent from './contents/SettingsContent';

function MyPageContainer() {
  const [activeMenu, setActiveMenu] = useState('home');
  const [transitionKey, setTransitionKey] = useState(0);
  const contentPanelRef = useRef(null);

  const menuItems = useMemo(
    () => [
      { key: 'home', label: '홈' },
      { key: 'profileInfo', label: '프로필 정보' },
      { key: 'emotionReport', label: '감정 리포트' },
      { key: 'botMenu', label: '봇 메뉴' },
      { key: 'letterBox', label: '쪽지함' },
      { key: 'settings', label: '설정' },
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
      case 'home':
      default:
        return <DashboardContent onInteractionSelect={handleInteractionSelect} />;
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
