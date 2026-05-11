/**
 * [파일 역할]
 * - 마이페이지의 전체 화면 흐름을 관리하는 메인 컨테이너 파일
 * - 왼쪽 메뉴 클릭에 따라 오른쪽에 어떤 콘텐츠를 보여줄지 결정
 *
 * [여기서 찾을 것]
 * - 메뉴 목록 수정: menuItems
 * - 메뉴 클릭 동작: handleMenuSelect
 * - 기본 화면: /mypage (쿼리 없음) → 대시보드; 메뉴는 ?section= 으로 동기화
 * - 각 메뉴별 화면 연결: renderContent
 * - 화면 전환 애니메이션 대상 처리: useEffect 아래 applyRevealItems
 *
 * [수정 포인트]
 * - 새 메뉴 추가: menuItems + renderContent 둘 다 수정
 * - 기본 화면 바꾸기: activeMenu 기본값(쿼리 없을 때) 로직
 * - Dashboard에 넘기는 값 수정: renderContent 안 DashboardContent props 수정
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import layoutStyles from '../layout/MyPageLayout.module.css';

import ProfileCard from '../layout/ProfileCard';
import SideMenu from '../layout/SideMenu';

import DashboardContent from '../contents/DashboardContent';
import ProfileInfoContent from '../contents/ProfileInfoContent';
import EmotionReportContent from '../contents/emotionReport/EmotionReportContent';
import BotMenuContent from '../contents/BotMenuContent';
import LetterBoxContent from '../contents/letterBox/LetterBoxContent';
import SettingsContent from '../contents/settings/SettingsContent';
import NotificationSettingsContent from '../contents/settings/NotificationSettingsContent';
import SupportHistoryContent from '../contents/SupportHistoryContent.jsx';
import { myPageAPI } from '../../../utils/api';
import { useChatModal } from '../../../contexts/ChatModalContext';

const VALID_MENU_KEYS = new Set([
  'dashboard',
  'profileInfo',
  'emotionReport',
  'botMenu',
  'letterBox',
  'settings',
  'notiSettings',
  'support',
]);

function MyPageContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openChat } = useChatModal();
  /* =========================
     현재 선택된 메뉴: URL ?section= | ?tab= 만 사용
     (/mypage 단독 진입 시 대시보드 — 다른 화면 갔다 와도 이전 메뉴 자동 복원 없음)
  ========================= */
  const activeMenu = useMemo(() => {
    const q = searchParams.get('section') || searchParams.get('tab');
    if (q && VALID_MENU_KEYS.has(q)) return q;
    return 'dashboard';
  }, [searchParams]);

  /* =========================
     화면 전환용 key
     - 메뉴 바뀔 때마다 +1
     - section key를 바꿔서 화면 전환 효과를 다시 실행
  ========================= */
  const [transitionKey, setTransitionKey] = useState(0);

  /* =========================
     오른쪽 콘텐츠 영역 DOM 참조
     - 카드들에 reveal 효과 적용할 때 사용
  ========================= */
  const contentPanelRef = useRef(null);

  const [letterData, setLetterData] = useState(null);

  const fetchLetters = () => {
    myPageAPI.getLetters()
      .then(data => {
        if (data) {
          const transformed = {
            featured: data.items?.[0] ? {
              id: data.items[0].id,
              unread: data.items[0].unread,
              title: data.items[0].title,
              sender: data.items[0].sender || '메이티',
              preview: data.items[0].preview,
              date: data.items[0].date,
              status: data.items[0].unread ? `새 편지 ${data.unreadCount}` : '읽음',
            } : {
              id: null,
              unread: false,
              title: '도착한 편지가 없어요',
              sender: '메이티',
              preview: '메이티가 편지를 보내면 여기에 표시돼요.',
              date: '',
              status: String(data.unreadCount || 0),
            },
            stats: [
              { label: '읽지 않은 편지', value: String(data.unreadCount || 0) },
              { label: '이번 주 도착', value: String(data.weeklyCount || 0) },
            ],
            items: (data.items || []).map(item => ({
              id: item.id,
              sender: item.sender || '메이티',
              title: item.title,
              preview: item.preview,
              date: item.date,
              unread: item.unread,
            })),
          };
          setLetterData(transformed);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
  }, []);

  useEffect(() => {
    if (activeMenu === 'letterBox') {
      fetchLetters();
    }
  }, [activeMenu]);

  const handleReadLetter = (letterId) => {
    myPageAPI.readLetter(letterId)
      .then(() => fetchLetters())
      .catch(console.error);
  };

  /* =========================
     왼쪽 사이드 메뉴 목록
     - 메뉴 이름 바꾸려면 여기 수정
     - 새 메뉴 추가하려면 여기 + renderContent 둘 다 수정
  ========================= */
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
      {
        key: 'support',
        label: '문의·신고 내역',
        description: '문의·신고 접수와 답변을 확인해요',
      },
    ],
    []
  );

  /* =========================
     왼쪽 메뉴 클릭하는 코드
     - 같은 메뉴를 다시 누르면 아무 일도 안 함
     - 다른 메뉴를 누르면 activeMenu 변경
  ========================= */
  const handleMenuSelect = (menuKey) => {
    if (menuKey === activeMenu) return;

    if (menuKey === 'dashboard') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ section: menuKey }, { replace: true });
    }
    setTransitionKey((prev) => prev + 1);
  };

  /* =========================
     대시보드 안에서 "상담하기"나 "메이티 정보"로 이동시키는 코드
     - DashboardContent 내부 버튼 등에서 사용 가능
  ========================= */
  const handleInteractionSelect = (key) => {
    if (key === 'counsel') {
      openChat();
      return;
    }
    if (activeMenu !== 'botMenu') {
      setSearchParams({ section: 'botMenu' }, { replace: true });
      setTransitionKey((prev) => prev + 1);
    }
  };

  /* =========================
     현재 메뉴에 따라 오른쪽 화면 바꿔주는 코드
     - 메뉴 추가/삭제할 때 가장 중요하게 보는 곳
  ========================= */
  const renderContent = () => {
    switch (activeMenu) {
      case 'profileInfo':
        return <ProfileInfoContent />;

      case 'emotionReport':
        return <EmotionReportContent />;

      case 'botMenu':
        return <BotMenuContent />;

      case 'letterBox':
        return <LetterBoxContent letterData={letterData || undefined} onRead={handleReadLetter} />;

      case 'settings':
        return <SettingsContent onSelectMenu={handleMenuSelect} />;

      case 'notiSettings':
        return (
          <article>
            <header style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#2b2640' }}>알림 상세 설정</h2>
              <p style={{ color: '#8a85a0', marginTop: '4px' }}>받고 싶은 알림을 자유롭게 설정하세요.</p>
            </header>
            <NotificationSettingsContent />
          </article>
        );

      case 'support':
        return <SupportHistoryContent />;

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

  /* =========================
     화면 카드 reveal 효과 대상 잡는 코드
     - content 안의 article/card 요소를 찾아서
       data-reveal-item 속성을 붙임
     - CSS 애니메이션용 보조 처리라고 생각하면 됨
     *
     * [나중에 수정할 때]
     * - 애니메이션을 아예 끄고 싶으면 이 useEffect를 제거
     * - 카드 인식 조건 바꾸려면 rect.width / rect.height 부분 수정
  ========================= */
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

  /* =========================
     실제 화면 그리는 코드
     - 왼쪽: 프로필 카드 + 사이드 메뉴
     - 오른쪽: 선택된 콘텐츠
  ========================= */
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
