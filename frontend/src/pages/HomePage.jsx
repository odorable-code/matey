/**
 * =========================================================
 * 파일명 : src/pages/HomePage.jsx
 * 역할   : 메인 홈 페이지 (Hero / 봇 4인 카드 / Features / FAQ 통합)
 * 위치   : 라우터 "/" 경로 진입점
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 사이트 메인 페이지 전체 구조 조립 (Hero → 봇카드 → Features → FAQ)
 * - 봇 4인 카드 섹션을 페이지 내부에서 직접 렌더링
 * - URL 해시(#features, #faq, #mates)로 진입 시 해당 섹션으로 부드러운 스크롤
 * - 봇 카드 클릭 시 채팅 페이지 또는 회원가입 페이지로 이동
 *
 * [이번 수정 핵심]
 * - 하단 "필요할 때 바로 이어서 보기" 빠른 이동 카드 섹션 완전 제거
 *   ┕ FAQ 섹션 다음 흐름이 더 깔끔하게 마무리되도록 정리
 *   ┕ HOME_SHORTCUTS 상수, handleShortcutClick 핸들러도 함께 제거
 * - Header / Footer 는 MainLayout.jsx 에서 공통 렌더링되므로 이 파일에서는 미렌더링
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) handleMateClick
 *    - 봇 카드 클릭 시 이동 경로 변경
 *
 * 2) 캐릭터 정보(이름/이미지/태그/능력치)는
 *    src/constants/mates.js 에서 수정
 *
 * 3) Header / Footer 톤이나 메뉴를 바꾸려면
 *    src/components/3_Layout/MainLayout.jsx 에서 처리
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Hero from '../components/4_Home/Hero';
import Features from '../components/4_Home/Features';
import FAQ from '../components/4_Home/FAQ';
import HomeClosingCta from 'pages/HomeClosingCta';
import { useAuth } from '../contexts/AuthContext';
import { MATES } from '../constants/mates';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const loggedIn = isAuthenticated || !!user;

  /* =========================================================
     해시 진입 시 해당 섹션으로 부드러운 스크롤
  ========================================================= */
  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace('#', '');
    const target = document.getElementById(id);
    if (!target) return;

    const offset = -96;
    const top = target.getBoundingClientRect().top + window.pageYOffset + offset;

    window.scrollTo({ top, behavior: 'smooth' });
  }, [location.hash]);

  /* =========================================================
     메이트 카드 클릭 코드
     - 로그인 상태: 채팅 페이지로 이동(메이트 키 전달)
     - 비로그인  : 회원가입으로 이동
  ========================================================= */
  const handleMateClick = (mateKey) => {
    if (loggedIn) {
      navigate(`/chat?mate=${mateKey}`);
      return;
    }
    navigate('/signup');
  };

  return (
    <div className="matey-home">
      {/* =========================================================
         Header / Footer 는 MainLayout.jsx 에서 공통으로 렌더링됨
         이 페이지에서는 본문(main)만 그림
      ========================================================= */}
      <main className="matey-home__main">
        {/* =========================================================
           1. Hero 섹션
        ========================================================= */}
        <Hero />

        {/* =========================================================
           2. 봇 4인 카드 섹션
        ========================================================= */}
        <section
          id="mates"
          className="matey-mates"
          aria-label="메이티 메이트 4인 소개"
        >
          <div className="matey-mates__background" aria-hidden="true">
            <span className="matey-mates__glow matey-mates__glow--top" />
            <span className="matey-mates__glow matey-mates__glow--bottom" />
          </div>

          <div className="matey-mates__inner">
            {/* 섹션 헤더 */}
            <header className="matey-mates__header">
              <span className="matey-mates__eyebrow">
                <span className="matey-mates__eyebrow-dot" />
                Meet your mate
              </span>

              <h2 className="matey-mates__title">
                메이티 안에는
                <br />
                <span className="matey-mates__title-accent">
                  성격이 다른 4명의 메이트
                </span>
                가 있어요
              </h2>

              <p className="matey-mates__description">
                처음 시작이 편한 타입, 차분히 정리해주는 타입, 핵심을 잘 짚는
                타입, 마음을 다독여주는 타입까지.
                <br />
                대화 전에 성격과 능력치를 가볍게 보고 고를 수 있어요.
              </p>
            </header>

            {/* 봇 카드 그리드 */}
            <div className="matey-mates__grid" role="list">
              {MATES.map((mate) => (
                <article
                  key={mate.key}
                  className={`matey-mate-card ${mate.accent}`}
                  role="listitem"
                  onClick={() => handleMateClick(mate.key)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleMateClick(mate.key);
                    }
                  }}
                >
                  {/* 카드 이미지 영역 */}
                  <div className="matey-mate-card__visual">
                    <span
                      className="matey-mate-card__visual-glow"
                      aria-hidden="true"
                    />
                    <img
                      src={mate.image}
                      alt={`${mate.name} 캐릭터`}
                      className="matey-mate-card__image"
                      draggable={false}
                    />
                  </div>

                  {/* 태그 영역 */}
                  <div className="matey-mate-card__tags">
                    {mate.tags.map((tag) => (
                      <span key={tag} className="matey-mate-card__tag">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 헤드라인 영역 */}
                  <div className="matey-mate-card__headline">
                    <span className="matey-mate-card__role">{mate.role}</span>
                    <h3 className="matey-mate-card__name">{mate.name}</h3>
                    <p className="matey-mate-card__copy">{mate.headline}</p>
                  </div>

                  {/* 능력치 영역 (hover 시 확장) */}
                  <div className="matey-mate-card__stats">
                    {mate.stats.map((stat) => (
                      <div key={stat.label} className="matey-mate-card__stat">
                        <div className="matey-mate-card__stat-row">
                          <span className="matey-mate-card__stat-label">
                            {stat.label}
                          </span>
                          <span className="matey-mate-card__stat-value">
                            {stat.value}
                          </span>
                        </div>
                        <div className="matey-mate-card__stat-track">
                          <span
                            className="matey-mate-card__stat-fill"
                            style={{ width: `${stat.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 카드 푸터 - 진입 CTA */}
                  <div className="matey-mate-card__footer">
                    <span className="matey-mate-card__cta">
                      이 메이트와 대화하기
                      <span
                        className="matey-mate-card__cta-arrow"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
           3. Features 섹션
        ========================================================= */}
        <Features />

        {/* =========================================================
           4. FAQ 섹션
        ========================================================= */}
        <FAQ />

        <HomeClosingCta />
      </main>
    </div>
  );
}

export default HomePage;
