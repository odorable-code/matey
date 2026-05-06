/**
 * =========================================================
 * 파일명 : src/components/1_Header/Header.jsx
 * 역할   : 사이트 공통 상단 헤더
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 로고 클릭 시 홈으로 이동
 * - 가운데 메뉴에서 이용방법 / 무료체험 / 커뮤니티 / 봇랭킹 / FAQ 이동
 * - 비회원은 로그인 / 무료체험 버튼 표시
 * - 회원은 채팅하기 / 알람 / 마이페이지 / 관리자 / 프로필 드롭다운 표시
 * - 모바일 메뉴 열기/닫기 처리
 *
 * [이번 수정 핵심]
 * - "채팅하기" 클릭 시 메이트 키 없이 openChat() 호출
 *   → 새 세션이 즉시 만들어지지 않고
 *     좌측 사이드바 + 우측 "왼쪽에서 대화방을 골라주세요" 빈 상태 화면으로 진입
 * - 디자인 / 다른 동작은 그대로 유지
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) NAV_ITEMS                : 가운데 메뉴 구성
 * 2) handlePrimaryAction      : 채팅 모달 호출
 * 3) handleToggleNotifications: 알람 popover 토글
 * =========================================================
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
    if (typeof isAdmin === 'function') return isAdmin();
    return !!user?.is_admin || !!user?.isAdmin || user?.role === 'admin';
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
     ✅ 채팅 모달 호출
     - 비회원: 회원가입 페이지로 이동
     - 회원  : 메이트 키 없이 openChat()
       → 사이드바 + "왼쪽에서 대화방을 골라주세요" 빈 상태로 진입
       (자동으로 새 채팅방 생성하지 않음)
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
  ========================================================= */
  const isNavActive = (path) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <header className={`matey-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="matey-header__shell">
        <div className="matey-header__inner">
          {/* 왼쪽 로고 */}
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

          {/* 가운데 메뉴 */}
          <div className="matey-header__center">
            <nav className="matey-header__nav" aria-label="메인 메뉴">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`matey-header__nav-link ${
                    isNavActive(item.path) ? 'is-active' : ''
                  }`}
                  onClick={() => handleNavClick(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 오른쪽 액션 */}
          <div className="matey-header__right">
            <div className="matey-header__actions">
              {!loggedIn ? (
                <div className="matey-header__auth-group">
                  <Link to="/login" className="matey-header__text-button">
                    로그인
                  </Link>
                  <button
                    type="button"
                    className="matey-header__primary"
                    onClick={handlePrimaryAction}
                  >
                    무료체험
                  </button>
                </div>
              ) : (
                <>
                  <div className="matey-header__auth-group">
                    <button
                      type="button"
                      className="matey-header__primary"
                      onClick={handlePrimaryAction}
                    >
                      채팅하기
                    </button>

                    {adminUser && (
                      <Link to="/admin" className="matey-header__text-button">
                        관리자 대시보드
                      </Link>
                    )}

                    <Link to="/mypage" className="matey-header__text-button">
                      마이페이지
                    </Link>
                  </div>

                  {/* ✅ 알람 버튼 + popover */}
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
                      <Link
                        to="/mypage"
                        className="matey-header__dropdown-link"
                        onClick={() => setProfileOpen(false)}
                      >
                        마이페이지
                      </Link>
                      {adminUser && (
                        <Link
                          to="/admin"
                          className="matey-header__dropdown-link"
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

            {/* 모바일 햄버거 */}
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

      {/* 모바일 메뉴 */}
      <div className={`matey-header__mobile ${mobileOpen ? 'is-open' : ''}`}>
        <button
          type="button"
          className="matey-header__mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="모바일 메뉴 닫기"
        />

        <div className="matey-header__mobile-panel">
          <div className="matey-header__mobile-top">
            <div className="matey-header__mobile-brand">
              <span className="matey-header__mobile-brand-mark">M</span>
              <div className="matey-header__mobile-brand-copy">
                <strong>메이티</strong>
                <span>대화하기 편한 AI 상담 메이트</span>
              </div>
            </div>
          </div>

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
                무료체험
              </button>
            </div>
          ) : (
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
                className="matey-header__mobile-secondary"
                onClick={() => setMobileOpen(false)}
              >
                마이페이지
              </Link>

              {adminUser && (
                <Link
                  to="/admin"
                  className="matey-header__mobile-soft"
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
