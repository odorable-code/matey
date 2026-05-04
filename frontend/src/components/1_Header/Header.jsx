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
 * - 회원은 채팅하기 / 마이페이지 / 관리자 / 프로필 드롭다운 표시
 * - 모바일 메뉴 열기/닫기 처리
 *
 * [이번 수정 핵심]
 * - "채팅하기" 버튼을 페이지 이동(/chat) 대신 전역 채팅 모달로 연결
 *   → useChatModal() 의 openChat() 호출
 * - 비회원이 "무료체험" 누르면 → /signup 으로 이동 (기존 유지)
 * - 회원이 "채팅하기" 누르면 → 모달이 화면 위로 떠오름
 * - 모바일 메뉴의 "채팅하기" 도 동일하게 모달 호출로 변경
 * - 디자인/CSS 는 그대로 유지 (Header.css 수정 없음)
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) NAV_ITEMS
 *    - 가운데 메뉴 순서/문구/경로 변경
 *
 * 2) handlePrimaryAction
 *    - 우측 메인 버튼 동작 (회원: 모달 / 비회원: 회원가입)
 *
 * 3) handleNavClick
 *    - 메뉴 클릭 시 라우팅 이동 처리
 *
 * 4) isNavActive
 *    - 현재 pathname 기준 활성 메뉴 처리
 * =========================================================
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChatModal } from '../../contexts/ChatModalContext';
import './Header.css';

/* =========================================================
   가운데 메뉴 설정 코드
   - 별도 페이지 라우팅 기준으로 관리
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
     전역 채팅 모달 컨트롤러
     - openChat(mateKey) : 모달 열기 (메이트 지정 가능)
     - 회원이 "채팅하기" 누르면 모달이 떠오르도록 연결
  ========================================================= */
  const { openChat } = useChatModal();

  /* =========================================================
     로그인 상태 / 관리자 상태 판단 코드
  ========================================================= */
  const loggedIn = isAuthenticated || !!user;

  const adminUser = useMemo(() => {
    if (typeof isAdmin === 'function') {
      return isAdmin();
    }

    return !!user?.is_admin || !!user?.isAdmin || user?.role === 'admin';
  }, [isAdmin, user]);

  /* =========================================================
     헤더 상태 코드
     - isScrolled  : 스크롤 시 헤더 배경 변화
     - mobileOpen  : 모바일 메뉴 열림 상태
     - profileOpen : 프로필 드롭다운 열림 상태
  ========================================================= */
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  /* =========================================================
     스크롤 상태 감지 코드
  ========================================================= */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* =========================================================
     모바일 메뉴 열릴 때 body 스크롤 잠금
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
     페이지 이동 시 열려 있던 메뉴/드롭다운 닫기
  ========================================================= */
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  /* =========================================================
     프로필 바깥 영역 클릭 시 드롭다운 닫기
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
     홈 이동 코드
  ========================================================= */
  const handleGoHome = () => {
    setMobileOpen(false);
    setProfileOpen(false);
    navigate('/');
  };

  /* =========================================================
     ✅ 우측 메인 버튼 클릭 코드
     - 비회원: 회원가입 페이지로 이동
     - 회원  : 채팅 모달 오픈 (페이지 이동 X)
  ========================================================= */
  const handlePrimaryAction = () => {
    setMobileOpen(false);
    setProfileOpen(false);

    if (loggedIn) {
      // 채팅 페이지로 이동하지 않고, 전역 채팅 모달을 띄움
      openChat('dog'); // 기본 메이트 지정 (원하는 메이트 키로 변경 가능)
      return;
    }

    navigate('/signup');
  };

  /* =========================================================
     가운데 메뉴 클릭 처리 코드
     - 각 메뉴를 별도 라우트로 이동
  ========================================================= */
  const handleNavClick = (path) => {
    setMobileOpen(false);
    setProfileOpen(false);
    navigate(path);
  };

  /* =========================================================
     로그아웃 코드
  ========================================================= */
  const handleLogout = async () => {
    try {
      setProfileOpen(false);
      setMobileOpen(false);

      if (typeof logout === 'function') {
        await logout();
      }

      navigate('/');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  /* =========================================================
     현재 메뉴 active 표시 코드
     - 현재 pathname 기준으로 활성 처리
  ========================================================= */
  const isNavActive = (path) => {
    if (!path) return false;

    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className={`matey-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="matey-header__shell">
        <div className="matey-header__inner">
          {/* ===================================================
              왼쪽 로고 영역
          ==================================================== */}
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

          {/* ===================================================
              가운데 메뉴 영역
              - 이용방법 / 무료체험 / 커뮤니티 / 봇랭킹 / FAQ
          ==================================================== */}
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

          {/* ===================================================
              오른쪽 액션 영역
          ==================================================== */}
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
                    {/* ✅ 채팅하기: 페이지 이동 대신 모달 오픈 */}
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

            {/* =================================================
                모바일 햄버거 버튼
            ================================================== */}
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

      {/* =======================================================
          모바일 메뉴 전체 영역
      ======================================================== */}
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
              {/* ✅ 모바일 "채팅하기" 도 모달 호출 */}
              <button
                type="button"
                className="matey-header__mobile-primary"
                onClick={handlePrimaryAction}
              >
                채팅하기
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
