/**
 * =========================================================
 * 파일명 : src/components/2_Footer/Footer.jsx
 * 역할   : 사이트 전체 공통 Footer 컴포넌트
 * 위치   : 모든 페이지 하단 공통 영역
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 사이트 전체 공통 마무리 영역(브랜드 / 링크 그룹 / 마무리 CTA / 저작권)
 * - 홈 내부 섹션(features, faq) 부드러운 스크롤 이동 지원
 * - 다른 페이지에서 진입했을 때는 홈으로 이동 후 해당 섹션 스크롤
 * - 작은 캐릭터(햄스터) 한 마리로 "마지막까지 함께 가는 가이드" 톤 유지
 *
 * [이번 수정 핵심]
 * - 위 섹션(Hero / 봇카드 / Features / FAQ)과 디자인 시스템 일체감 강화
 * - CTA는 한 개만 노출하고 메인 CTA와 위계 분리
 * - 캐릭터 데이터(이미지/이름)를 src/constants/mates.js 에서 가져와 사용
 *   → 이름/이미지 바뀌면 자동 반영
 * - 없는 메뉴(요금제, 다운로드)는 완전히 제거된 상태 유지
 * - 텍스트 폰트 위계 정리 (타이틀 / 링크 / 캡션)
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) FOOTER_COPY
 *    - 브랜드 설명 / CTA 라벨 / 마무리 멘트
 *
 * 2) FOOTER_LINK_GROUPS
 *    - 좌/우 링크 그룹 데이터 변경
 *
 * 3) FOOTER_BOTTOM_LINKS
 *    - 하단 보조 링크 변경
 *
 * 4) handleMove
 *    - 라우트 / 섹션 이동 처리 변경
 *
 * 5) 캐릭터 정보(이미지/이름)는
 *    src/constants/mates.js 에서 수정
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MATE_IMAGES, MATE_NAMES } from '../../constants/mates';
import './Footer.css';

/* =========================================================
   섹션 카피 코드
========================================================= */
const FOOTER_COPY = {
  brandTitle: 'Matey',
  brandDescription:
    '부담 없이 시작하고, 편하게 이어가고, 필요한 순간 다시 찾아볼 수 있는 AI 대화 메이트 서비스예요.',
  ctaTitle: '오늘은 가볍게 한 줄부터 시작해볼까요?',
  ctaDescription:
    '처음이라면 무료체험부터, 궁금한 게 남아 있다면 FAQ부터 보면 돼요.',
  primaryLabel: '대화 시작하기',
  bubble: '여기까지 와줘서 고마워요. 천천히 다시 찾아와도 괜찮아요.',
};

/* =========================================================
   링크 그룹 코드
   - type: 'route'   → 페이지 이동
   - type: 'section' → 홈 내부 스크롤
========================================================= */
const FOOTER_LINK_GROUPS = [
  {
    title: '서비스',
    links: [
      { label: '이용 방법', type: 'section', value: 'features' },
      { label: 'FAQ', type: 'section', value: 'faq' },
      { label: '커뮤니티', type: 'route', value: '/community' },
      { label: '봇랭킹', type: 'route', value: '/bot-ranking' },
    ],
  },
  {
    title: '계정',
    links: [
      { label: '로그인', type: 'route', value: '/login' },
      { label: '회원가입', type: 'route', value: '/signup' },
      { label: '마이페이지', type: 'route', value: '/mypage' },
      { label: '무료체험', type: 'route', value: '/free-trial' },
    ],
  },
];

/* =========================================================
   하단 보조 링크 코드
========================================================= */
const FOOTER_BOTTOM_LINKS = [
  { label: '이용 흐름', type: 'section', value: 'features' },
  { label: '자주 묻는 질문', type: 'section', value: 'faq' },
  { label: '회원가입', type: 'route', value: '/signup' },
];

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  /* =========================================================
     홈 섹션 스크롤 이동 함수
     - 현재 홈이면 바로 스크롤
     - 다른 페이지면 홈으로 이동 후 해시 전달
  ========================================================= */
  const moveToSection = (sectionId) => {
    if (location.pathname === '/') {
      const target = document.getElementById(sectionId);
      if (target) {
        const offset = -96;
        const top =
          target.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top, behavior: 'smooth' });
        return;
      }
    }

    navigate(`/#${sectionId}`);
  };

  /* =========================================================
     공통 이동 처리 코드
  ========================================================= */
  const handleMove = (type, value) => {
    if (type === 'route') {
      navigate(value);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (type === 'section') {
      moveToSection(value);
    }
  };

  /* =========================================================
     CTA 클릭 처리 코드
  ========================================================= */
  const handlePrimary = () => {
    navigate('/free-trial');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* =========================================================
     로고 클릭 → 홈 이동
  ========================================================= */
  const handleBrandClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* =========================================================
     마무리 캐릭터(햄스터 = hamster) 데이터 가져오기
  ========================================================= */
  const guideImage = MATE_IMAGES.hamster;
  const guideName = MATE_NAMES.hamster;

  return (
    <footer className="matey-footer" aria-label="사이트 푸터">
      {/* =========================================================
         배경 글로우
      ========================================================= */}
      <div className="matey-footer__background" aria-hidden="true">
        <span className="matey-footer__glow matey-footer__glow--top" />
        <span className="matey-footer__glow matey-footer__glow--bottom" />
      </div>

      <div className="matey-footer__inner">
        {/* =========================================================
           상단 - 마무리 CTA 배너
        ========================================================= */}
        <section
          className="matey-footer__cta"
          aria-label="대화 시작 안내"
        >
          <div className="matey-footer__cta-copy">
            <span className="matey-footer__cta-eyebrow">
              <span className="matey-footer__cta-eyebrow-dot" />
              The end of page · 시작 전에 한 번 더
            </span>

            <h2 className="matey-footer__cta-title">
              {FOOTER_COPY.ctaTitle}
            </h2>

            <p className="matey-footer__cta-description">
              {FOOTER_COPY.ctaDescription}
            </p>

            <div className="matey-footer__cta-actions">
              <button
                type="button"
                className="matey-footer__cta-primary"
                onClick={handlePrimary}
              >
                {FOOTER_COPY.primaryLabel}
                <span
                  className="matey-footer__cta-arrow"
                  aria-hidden="true"
                >
                  →
                </span>
              </button>
            </div>
          </div>

          <div className="matey-footer__cta-mate">
            <div className="matey-footer__cta-bubble">
              {FOOTER_COPY.bubble}
              <span
                className="matey-footer__cta-bubble-tail"
                aria-hidden="true"
              />
            </div>

            <div className="matey-footer__cta-mate-image-wrap">
              <span
                className="matey-footer__cta-mate-glow"
                aria-hidden="true"
              />
              <img
                src={guideImage}
                alt={`${guideName} 캐릭터`}
                className="matey-footer__cta-mate-image"
                draggable={false}
              />
            </div>
          </div>
        </section>

        {/* =========================================================
           메인 - 브랜드 + 링크 그룹
        ========================================================= */}
        <div className="matey-footer__main">
          <div className="matey-footer__brand">
            <button
              type="button"
              className="matey-footer__brand-mark"
              onClick={handleBrandClick}
              aria-label="메이티 홈으로 이동"
            >
              <span className="matey-footer__brand-badge">M</span>
              <span className="matey-footer__brand-text">
                {FOOTER_COPY.brandTitle}
              </span>
            </button>

            <p className="matey-footer__brand-description">
              {FOOTER_COPY.brandDescription}
            </p>
          </div>

          <nav
            className="matey-footer__nav"
            aria-label="푸터 링크 그룹"
          >
            {FOOTER_LINK_GROUPS.map((group) => (
              <div key={group.title} className="matey-footer__group">
                <h3 className="matey-footer__group-title">{group.title}</h3>

                <ul className="matey-footer__group-list">
                  {group.links.map((link) => (
                    <li key={link.label} className="matey-footer__group-item">
                      <button
                        type="button"
                        className="matey-footer__link"
                        onClick={() => handleMove(link.type, link.value)}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* =========================================================
           하단 - 저작권 + 보조 링크
        ========================================================= */}
        <div className="matey-footer__bottom">
          <p className="matey-footer__caption">
            © 2026 Matey. All rights reserved.
          </p>

          <div className="matey-footer__bottom-links">
            {FOOTER_BOTTOM_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                className="matey-footer__bottom-link"
                onClick={() => handleMove(link.type, link.value)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
