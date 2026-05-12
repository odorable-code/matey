/**
 * =========================================================
 * 파일명 : src/components/1_Header/Header.jsx
 * 역할   : 사이트 공통 상단 헤더
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 로고 클릭 시 홈으로 이동
 * - 가운데 메뉴에서 이용방법 / 무료체험 / 커뮤니티 / 봇랭킹 / FAQ 이동
 * - 비회원은 로그인 / 회원가입 버튼 표시 (회원가입 → /signup)
 * - 회원은 채팅하기 / 알람 / 마이페이지(상단 링크) / 프로필 드롭다운 표시
 * - 관리자 계정은 "관리자 대시보드"를 프로필 드롭다운 안에서만 표시
 * - 모바일 메뉴 열기/닫기 처리
 *
 * [이번 수정 핵심]
 * - 상단 바(auth-group)에서 "관리자 대시보드" 제거
 * - 프로필 드롭다운 안에서만 "관리자 대시보드" 노출
 * - "채팅하기" 클릭 시 메이트 키 없이 openChat() 호출
 *   → 좌측 대화방 목록 + 우측 빈 상태 화면으로 진입
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) NAV_ITEMS                : 가운데 메뉴 구성
 * 2) getAdminUser() 로직      : 관리자 표시 조건
 * 3) handlePrimaryAction      : 채팅 모달 호출
 * 4) handleToggleNotifications: 알람 popover 토글
 * =========================================================
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessAdminPage } from 'utils/adminAccess';
import { useChatModal } from '../../contexts/ChatModalContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationModal from '../16_NotificationModal/NotificationModal';
import './Header.css';

/* =========================================================
   가운데 메뉴 설정 코드
========================================================= */
const NAV_ITEMS = [
  { key: 'features', label: '이용방법', path: '/features' },
  { key: 'free-trial', label: '무료체험', path: '/free-trial' },
  { key: 'community', label: '커뮤니티', path: '/community' },
  { key: 'bot-ranking', label: '봇랭킹', path: '/bot-ranking' },
  { key: 'faq', label: 'FAQ', path: '/faq' },
];

/* =========================================================
   관리자 여부 판별 코드
   - AuthContext 에서 isAdmin 이 함수인 경우
   - boolean 인 경우
   - user.role / roles / authorities 등 다양한 구조 대응
========================================================= */
function getAdminUser(isAdminValue, user, canAccessAdmin) {
  try {
    if (typeof canAccessAdmin === 'function' && canAccessAdmin(user)) {
      return true;
    }

    if (typeof isAdminValue === 'function') {
      const result = isAdminValue();
      if (typeof result === 'boolean') return result;
    }

    if (typeof isAdminValue === 'boolean') {
      return isAdminValue;
    }

    if (user?.is_admin === true || user?.isAdmin === true) {
      return true;
    }

    const singleRoles = [
      user?.role,
      user?.userRole,
      user?.memberRole,
      user?.authority,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    const arrayRoles = [
      ...(Array.isArray(user?.roles) ? user.roles : []),
      ...(Array.isArray(user?.authorities) ? user.authorities : []),
      ...(Array.isArray(user?.permissions) ? user.permissions : []),
    ]
      .map((value) => {
        if (typeof value === 'string') return value.toLowerCase();
        if (value?.role) return String(value.role).toLowerCase();
        if (value?.name) return String(value.name).toLowerCase();
        if (value?.authority) return String(value.authority).toLowerCase();
        return '';
      })
      .filter(Boolean);

    const mergedRoles = [...singleRoles, ...arrayRoles];

    return mergedRoles.some((role) =>
      [
        'admin',
        'administrator',
        'role_admin',
        'super_admin',
        'master',
      ].includes(role)
    );
  } catch (error) {
    console.error('관리자 여부 판별 중 오류:', error);
    return false;
  }
}

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();

  /* =========================================================
     전역 모달 컨트롤러
  ========================================================= */
  const { openChat } = useChatModal();
  const {
    isOpen: notiOpen,
    openNotifications,
    closeNotifications,
    unreadCount,
  } = useNotifications();

  /* =========================================================
     로그인 / 관리자 판단
  ========================================================= */
  const loggedIn = isAuthenticated || !!user;

  const adminUser = useMemo(() => {
    return getAdminUser(isAdmin, user, canAccessAdminPage);
  }, [isAdmin, user]);

  /* =========================================================
     헤더 상태
  ========================================================= */
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);
  const notiAnchorRef = useRef(null);

  /* =========================================================
     스크롤 감지
  ========================================================= */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* =========================================================
     모바일 메뉴 열릴 때 body 잠금
  ========================================================= */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }

    document.body.style.overflow = '';
    return undefined;
  }, [mobileOpen]);

  /* =========================================================
     라우트 변경 시 메뉴/팝오버 닫기
  ========================================================= */
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    closeNotifications();
  }, [location.pathname, closeNotifications]);

  /* =========================================================
     프로필 바깥 클릭 시 닫기
  ========================================================= */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* =========================================================
     홈 이동
  ========================================================= */
  const handleGoHome = () => {
    setMobileOpen(false);
    setProfileOpen(false);
    closeNotifications();
    navigate('/');
  };

  /* =========================================================
     채팅 모달 호출
     - 비회원: 회원가입 페이지로 이동
     - 회원  : 메이트 키 없이 openChat()
       → 자동 새 방 생성 없이 빈 상태 화면으로 진입
  ========================================================= */
  const handlePrimaryAction = () => {
    setMobileOpen(false);
    setProfileOpen(false);
    closeNotifications();

    if (loggedIn) {
      openChat();
      return;
    }

    navigate('/signup');
  };

  /* =========================================================
     알람 popover 토글
  ========================================================= */
  const handleToggleNotifications = () => {
    setProfileOpen(false);

    if (notiOpen) {
      closeNotifications();
    } else {
      openNotifications();
    }
  };

  /* =========================================================
     가운데 메뉴 클릭
  ========================================================= */
  const handleNavClick = (path) => {
    setMobileOpen(false);
    setProfileOpen(false);
    closeNotifications();
    navigate(path);
  };

  /* =========================================================
     로그아웃
  ========================================================= */
  const handleLogout = async () => {
    try {
      setProfileOpen(false);
      setMobileOpen(false);
      closeNotifications();

      if (typeof logout === 'function') {
        await logout();
      }

      navigate('/');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  /* =========================================================
     active 메뉴 판별
     - /community/faq 는 헤더「FAQ」에만 매칭 (커뮤니티 하위 FAQ라도 탭은 FAQ 강조)
  ========================================================= */
  const isNavActive = (item) => {
    const path = item?.path;
    if (!path) return false;
    const { pathname } = location;
    if (path === '/') return pathname === '/';

    if (item.key === 'faq') {
      return pathname === '/faq' || pathname === '/community/faq';
    }

    if (item.key === 'community') {
      if (pathname === '/community/faq') return false;
      return pathname === path || pathname.startsWith(`${path}/`);
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const myPageActive =
    location.pathname === '/mypage' || location.pathname.startsWith('/mypage/');

  const adminDashboardActive =
    location.pathname === '/admin' ||
    (location.pathname.startsWith('/admin/') &&
      !location.pathname.startsWith('/admin-access'));

  return (
    <header className={`matey-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="matey-header__shell">
        <div className="matey-header__inner">
          {/* =========================================================
              왼쪽 로고 영역
          ========================================================= */}
          <div className="matey-header__left">
            <Link
              to="/"
              className="matey-header__brand"
              onClick={(event) => {
                event.preventDefault();
                handleGoHome();
              }}
            >
              <span className="matey-header__brand-mark">M</span>

              <span className="matey-header__brand-copy">
                <strong className="matey-header__brand-text">메이티</strong>
                <span className="matey-header__brand-sub">
                  대화하기 편한 AI 상담 메이트
                </span>
              </span>
            </Link>
          </div>

          {/* =========================================================
              가운데 네비게이션
          ========================================================= */}
          <div className="matey-header__center">
            <nav className="matey-header__nav" aria-label="메인 메뉴">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`matey-header__nav-link ${
                    isNavActive(item) ? 'is-active' : ''
                  }`}
                  onClick={() => handleNavClick(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* =========================================================
              오른쪽 액션 영역
          ========================================================= */}
          <div className="matey-header__right">
            <div className="matey-header__actions">
              {!loggedIn ? (
                /* =====================================================
                   비회원 상태 버튼
                ===================================================== */
                <div className="matey-header__auth-group">
                  <Link
                    to="/login"
                    state={{ from: `${location.pathname}${location.search || ''}` }}
                    className="matey-header__text-button"
                  >
                    로그인
                  </Link>

                  <button
                    type="button"
                    className="matey-header__primary"
                    onClick={handlePrimaryAction}
                  >
                    회원가입
                  </button>
                </div>
              ) : (
                /* =====================================================
                   로그인 상태 버튼
                ===================================================== */
                <>
                  <div className="matey-header__auth-group">
                    <button
                      type="button"
                      className="matey-header__primary"
                      onClick={handlePrimaryAction}
                    >
                      채팅하기
                    </button>

                    <Link
                      to="/mypage"
                      className={`matey-header__text-button ${
                        myPageActive ? 'is-active' : ''
                      }`}
                      aria-current={myPageActive ? 'page' : undefined}
                    >
                      마이페이지
                    </Link>
                  </div>

                  {/* =====================================================
                     알람 버튼 + popover
                  ===================================================== */}
                  <div className="matey-header__noti-wrap" ref={notiAnchorRef}>
                    <button
                      type="button"
                      className={`matey-header__noti ${
                        unreadCount > 0 ? 'has-unread' : ''
                      } ${notiOpen ? 'is-open' : ''}`}
                      onClick={handleToggleNotifications}
                      aria-label={
                        unreadCount > 0
                          ? `알림 ${unreadCount}개 도착`
                          : '알림 열기'
                      }
                      aria-expanded={notiOpen}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <path
                          d="M12 3a6 6 0 0 0-6 6v3.2c0 .5-.2 1-.6 1.4L4 15h16l-1.4-1.4c-.4-.4-.6-.9-.6-1.4V9a6 6 0 0 0-6-6Z"
                          fill="currentColor"
                        />
                        <path
                          d="M10 18a2 2 0 0 0 4 0"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>

                      {unreadCount > 0 && (
                        <span className="matey-header__noti-dot" aria-hidden="true">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    <NotificationModal anchorRef={notiAnchorRef} />
                  </div>

                  {/* =====================================================
                     프로필 드롭다운
                     - 관리자 대시보드는 여기에서만 노출
                  ===================================================== */}
                  <div className="matey-header__profile" ref={profileRef}>
                    <button
                      type="button"
                      className={`matey-header__profile-trigger ${
                        profileOpen ? 'is-open' : ''
                      }`}
                      onClick={() => setProfileOpen((prev) => !prev)}
                    >
                      <span className="matey-header__avatar">
                        {user?.nickname?.[0] || user?.name?.[0] || '회'}
                      </span>

                      <span className="matey-header__profile-meta">
                        <span className="matey-header__profile-label">
                          환영해요
                        </span>
                        <span className="matey-header__profile-name">
                          {user?.nickname || user?.name || '회원'}
                        </span>
                      </span>

                      <span className="matey-header__profile-caret">▾</span>
                    </button>

                    <div
                      className={`matey-header__dropdown ${
                        profileOpen ? 'is-open' : ''
                      }`}
                    >
                      {adminUser && (
                        <Link
                          to="/admin"
                          className={`matey-header__dropdown-link ${
                            adminDashboardActive ? 'is-active' : ''
                          }`}
                          aria-current={adminDashboardActive ? 'page' : undefined}
                          onClick={() => setProfileOpen(false)}
                        >
                          관리자 대시보드
                        </Link>
                      )}

                      <button
                        type="button"
                        className="matey-header__dropdown-link matey-header__dropdown-link--danger"
                        onClick={handleLogout}
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* =========================================================
                모바일 햄버거 버튼
            ========================================================= */}
            <button
              type="button"
              className={`matey-header__menu-toggle ${
                mobileOpen ? 'is-open' : ''
              }`}
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="모바일 메뉴 열기"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          모바일 메뉴
      ========================================================= */}
      <div className={`matey-header__mobile ${mobileOpen ? 'is-open' : ''}`}>
        <button
          type="button"
          className="matey-header__mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="모바일 메뉴 닫기"
        />

        <div className="matey-header__mobile-panel">
          {/* 모바일 상단 브랜드 */}
          <div className="matey-header__mobile-top">
            <div className="matey-header__mobile-brand">
              <span className="matey-header__mobile-brand-mark">M</span>

              <div className="matey-header__mobile-brand-copy">
                <strong>메이티</strong>
                <span>대화하기 편한 AI 상담 메이트</span>
              </div>
            </div>
          </div>

          {/* 모바일 네비 */}
          <div className="matey-header__mobile-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`matey-header__mobile-link ${
                  isNavActive(item.path) ? 'is-active' : ''
                }`}
                onClick={() => handleNavClick(item.path)}
              >
                <span>{item.label}</span>
                <span className="matey-header__mobile-link-arrow">→</span>
              </button>
            ))}
          </div>

          <div className="matey-header__mobile-divider" />

          {!loggedIn ? (
            /* =====================================================
               모바일 비회원 버튼
            ===================================================== */
            <div className="matey-header__mobile-auth">
              <Link
                to="/login"
                className="matey-header__mobile-secondary"
                onClick={() => setMobileOpen(false)}
              >
                로그인
              </Link>

              <button
                type="button"
                className="matey-header__mobile-primary"
                onClick={handlePrimaryAction}
              >
                회원가입
              </button>
            </div>
          ) : (
            /* =====================================================
               모바일 로그인 상태 버튼
            ===================================================== */
            <div className="matey-header__mobile-actions">
              <button
                type="button"
                className="matey-header__mobile-primary"
                onClick={handlePrimaryAction}
              >
                채팅하기
              </button>

              <button
                type="button"
                className={`matey-header__mobile-soft ${
                  unreadCount > 0 ? 'has-unread' : ''
                }`}
                onClick={() => {
                  setMobileOpen(false);
                  openNotifications();
                }}
              >
                알림
                {unreadCount > 0 && (
                  <span className="matey-header__mobile-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <Link
                to="/mypage"
                className={`matey-header__mobile-secondary ${
                  myPageActive ? 'is-active' : ''
                }`}
                aria-current={myPageActive ? 'page' : undefined}
                onClick={() => setMobileOpen(false)}
              >
                마이페이지
              </Link>

              {adminUser && (
                <Link
                  to="/admin"
                  className={`matey-header__mobile-soft ${
                    adminDashboardActive ? 'is-active' : ''
                  }`}
                  aria-current={adminDashboardActive ? 'page' : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  관리자 대시보드
                </Link>
              )}

              <button
                type="button"
                className="matey-header__mobile-soft"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
