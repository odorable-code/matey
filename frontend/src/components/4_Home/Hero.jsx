/**
 * =========================================================
 * 파일명 : src/components/4_Home/Hero.jsx
 * 역할   : 메인 홈 화면 최상단 Hero 섹션
 * 위치   : HomePage 최상단, Header 바로 아래
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 메인 헤드라인 + 서브 카피 + CTA 2개를 좌측에 노출
 * - 우측은 4명의 메이트(dog/bear/cat/hamster) 캐릭터를 자동 전환
 * - 캐릭터별 말풍선/이름/한 줄 소개를 함께 노출
 * - 좌측 하단에 메이트 인디케이터 도트(4개) + 전환 인터랙션 제공
 * - "대화 시작하기" 클릭 시 로그인 여부에 따라 /chat or /signup 이동
 * - "메이트 둘러보기" 클릭 시 봇 카드 섹션으로 부드럽게 스크롤
 *
 * [이번 수정 핵심]
 * - 캐릭터 데이터(이름/역할/이미지/말풍선)를 src/constants/mates.js 로 이전
 * - Hero 내부에는 화면 표현(헤드라인/CTA/모션) 코드만 남김
 * - 이름 변경은 mates.js 한 곳에서만 수정하면 자동 반영
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) HERO_COPY
 *    - Hero 메인 헤드라인 / 서브 카피 / CTA 라벨 변경
 *
 * 2) AUTO_INTERVAL
 *    - 캐릭터 자동 전환 간격(ms) 변경
 *
 * 3) 캐릭터 정보(이름/이미지/말풍선 등)는
 *    src/constants/mates.js 에서 수정
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MATES } from '../../constants/mates';
import './Hero.css';

/* =========================================================
   메인 카피 코드
========================================================= */
const HERO_COPY = {
  eyebrow: 'AI 대화 메이트 · 메이티',
  titleTop: '마음이 복잡한 날에도,',
  titleBottom: '먼저 말 꺼내기 쉬운 메이트',
  description:
    '처음 방문한 사람도 부담 없이 시작할 수 있도록\n쉽고 부드러운 흐름으로 안내하는 AI 대화 메이트예요.',
  primaryLabel: '대화 시작하기',
  secondaryLabel: '메이트 둘러보기',
  pickerEyebrow: '오늘은 어떤 메이트와 이야기하고 싶나요?',
};

/* =========================================================
   자동 전환 간격(ms)
========================================================= */
const AUTO_INTERVAL = 7000;

function Hero() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const loggedIn = isAuthenticated || !!user;

  /* =========================================================
     현재 메이트 인덱스 / 자동 전환 일시정지 상태
  ========================================================= */
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const activeMate = MATES[activeIndex];

  /* =========================================================
     자동 전환 타이머 코드
  ========================================================= */
  useEffect(() => {
    if (isPaused) return undefined;

    timerRef.current = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % MATES.length);
    }, AUTO_INTERVAL);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused]);

  /* =========================================================
     도트 클릭 시 즉시 전환 + 잠깐 일시정지 후 재개
  ========================================================= */
  const handleDotClick = (index) => {
    if (index === activeIndex) return;

    setActiveIndex(index);
    setIsPaused(true);

    window.setTimeout(() => {
      setIsPaused(false);
    }, AUTO_INTERVAL + 800);
  };

  /* =========================================================
     CTA 클릭 처리 코드
  ========================================================= */
  const handlePrimaryClick = () => {
    if (loggedIn) {
      navigate('/chat');
      return;
    }
    navigate('/signup');
  };

  /* =========================================================
     메이트 둘러보기 → 봇 카드 섹션 스크롤
  ========================================================= */
  const handleSecondaryClick = () => {
    const target = document.getElementById('mates');
    if (!target) return;

    const offset = -96;
    const top = target.getBoundingClientRect().top + window.pageYOffset + offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <section className="matey-hero" aria-label="메이티 메인 영역">
      {/* =========================================================
         배경 글로우 레이어
      ========================================================= */}
      <div className="matey-hero__background" aria-hidden="true">
        <span className="matey-hero__glow matey-hero__glow--purple" />
        <span className="matey-hero__glow matey-hero__glow--blue" />
        <span className="matey-hero__glow matey-hero__glow--pink" />
      </div>

      <div className="matey-hero__inner">
        {/* =========================================================
           좌측 - 카피 영역
        ========================================================= */}
        <div className="matey-hero__copy">
          <span className="matey-hero__eyebrow">
            <span className="matey-hero__eyebrow-dot" />
            {HERO_COPY.eyebrow}
          </span>

          <h1 className="matey-hero__title">
            <span className="matey-hero__title-line">{HERO_COPY.titleTop}</span>
            <span className="matey-hero__title-line matey-hero__title-line--accent">
              {HERO_COPY.titleBottom}
            </span>
          </h1>

          <p className="matey-hero__description">{HERO_COPY.description}</p>

          <div className="matey-hero__actions">
            <button
              type="button"
              className="matey-hero__primary"
              onClick={handlePrimaryClick}
            >
              {HERO_COPY.primaryLabel}
              <span className="matey-hero__primary-arrow" aria-hidden="true">
                →
              </span>
            </button>

            <button
              type="button"
              className="matey-hero__secondary"
              onClick={handleSecondaryClick}
            >
              {HERO_COPY.secondaryLabel}
            </button>
          </div>

          {/* =========================================================
             메이트 인디케이터 도트
          ========================================================= */}
          <div className="matey-hero__picker">
            <span className="matey-hero__picker-eyebrow">
              {HERO_COPY.pickerEyebrow}
            </span>

            <div
              className="matey-hero__dots"
              role="tablist"
              aria-label="메이트 선택"
            >
              {MATES.map((mate, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={mate.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`matey-hero__dot ${
                      isActive ? 'is-active' : ''
                    } ${mate.accent}`}
                    onClick={() => handleDotClick(index)}
                  >
                    <span className="matey-hero__dot-name">{mate.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================
           우측 - 메이트 캐릭터 영역
        ========================================================= */}
        <div className={`matey-hero__stage ${activeMate.accent}`}>
          <div className="matey-hero__stage-frame" aria-hidden="true">
            <span className="matey-hero__stage-ring" />
            <span className="matey-hero__stage-soft" />
          </div>

          <div className="matey-hero__bubble" key={`bubble-${activeMate.key}`}>
            <span className="matey-hero__bubble-text">{activeMate.bubble}</span>
            <span className="matey-hero__bubble-tail" aria-hidden="true" />
          </div>

          <div
            className="matey-hero__mate"
            key={`mate-${activeMate.key}`}
          >
            <img
              src={activeMate.image}
              alt={`${activeMate.name} 캐릭터`}
              className="matey-hero__mate-image"
              draggable={false}
            />
          </div>

          <div
            className="matey-hero__caption"
            key={`caption-${activeMate.key}`}
          >
            <span className="matey-hero__caption-role">{activeMate.role}</span>
            <strong className="matey-hero__caption-name">
              {activeMate.name}
            </strong>
            <p className="matey-hero__caption-text">{activeMate.tagline}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
