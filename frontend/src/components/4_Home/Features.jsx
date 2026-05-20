/**
 * =========================================================
 * 파일명 : src/components/4_Home/Features.jsx
 * 역할   : 메인 홈 "이용 방법" 섹션 (흐름 3단계 + 특징 4가지 + CTA)
 * 위치   : HomePage 내 봇 4인 카드 섹션 다음
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 메이티 사용 흐름을 01 → 02 → 03 세 단계로 시각적으로 보여줌
 * - 메이티의 핵심 특징 4가지를 아이콘 카드로 정리
 * - 우측 상단에 곰(bear) 캐릭터 + 말풍선으로 가이드 분위기 연출
 * - 하단 CTA에서 채팅 시작 / FAQ 보기로 분기
 *
 * [이번 수정 핵심]
 * - 캐릭터 데이터(이미지/이름)는 src/constants/mates.js 에서 가져와 사용
 *   → 이름/이미지가 바뀌어도 자동 반영
 * - 큰 흰 카드 컨테이너 제거, 섹션 한 호흡으로 정리
 * - 흐름 단계(01/02/03)는 가로형 스텝, 특징 카드(4개)는 아이콘 카드로 분리
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) FEATURES_COPY
 *    - 섹션 헤드라인 / 서브 카피 / 말풍선 / CTA 라벨
 *
 * 2) FLOW_STEPS
 *    - 사용 흐름 3단계 데이터 (번호/제목/설명)
 *
 * 3) FEATURE_CARDS
 *    - 핵심 특징 4가지 카드 데이터 (아이콘/제목/설명)
 *
 * 4) handlePrimary / handleSecondary
 *    - CTA 클릭 시 이동 경로 변경
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MATE_IMAGES, MATE_NAMES } from '../../constants/mates';
import './Features.css';

/* =========================================================
   섹션 카피 코드
========================================================= */
const FEATURES_COPY = {
  eyebrow: 'How it works',
  titleTop: '처음이어도,',
  titleBottom: '어떻게 시작하면 되는지 바로 보여줄게요',
  description:
    '메이티는 복잡한 기능을 많이 보여주기보다, 처음 들어온 사람이 “아 여기선 이렇게 시작하면 되는구나” 하고 바로 이해할 수 있게 만드는 데 집중했어요.',
  bubble: '복잡한 건 줄이고, 흐름은 더 쉽게 정리해줄게요.',
  ctaTitle: '부담 없이 시작할 준비가 됐다면 바로 이어가보세요',
  ctaDescription: '궁금한 게 있다면 FAQ부터, 바로 시작하고 싶다면 회원가입부터 해보세요.',
  primaryLabel: '대화 시작하기',
  secondaryLabel: 'FAQ 보기',
};

/* =========================================================
   사용 흐름 3단계 코드
========================================================= */
const FLOW_STEPS = [
  {
    id: 1,
    number: '01',
    title: '편한 메이트부터 고르기',
    description:
      '지금 내 기분에 가장 잘 맞을 것 같은 메이트를 가볍게 보고 시작하면 돼요.',
  },
  {
    id: 2,
    number: '02',
    title: '한 문장으로 먼저 말하기',
    description:
      '길게 설명하지 않아도 괜찮아요. 지금 마음 상태를 짧게 말해도 대화가 시작돼요.',
  },
  {
    id: 3,
    number: '03',
    title: '괜찮았던 흐름 이어가기',
    description:
      '도움이 됐던 대화 톤이나 흐름은 다시 꺼내보며 더 편하게 이어갈 수 있어요.',
  },
];

/* =========================================================
   핵심 특징 4가지 카드 코드
========================================================= */
const FEATURE_CARDS = [
  {
    id: 'empathy',
    icon: '💜',
    title: '공감부터 시작',
    description:
      '정답을 먼저 내리기보다, 지금 마음을 먼저 받아주는 흐름이에요.',
    accent: 'is-feature-purple',
  },
  {
    id: 'easy',
    icon: '🍃',
    title: '쉬운 말로 안내',
    description:
      '처음 보는 사람도 부담 없도록 쉬운 문장과 단순한 흐름을 유지해요.',
    accent: 'is-feature-mint',
  },
  {
    id: 'mate',
    icon: '🎨',
    title: '캐릭터별 성격 차이',
    description:
      '다정함, 정리력, 핵심 요약, 안정감처럼 메이트별 장점이 분명해요.',
    accent: 'is-feature-pink',
  },
  {
    id: 'resume',
    icon: '🔖',
    title: '이어보기 쉬움',
    description:
      '한 번에 다 하지 않아도, 편할 때 다시 돌아와서 이어가면 돼요.',
    accent: 'is-feature-blue',
  },
];

function Features() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const loggedIn = isAuthenticated || !!user;

  /* =========================================================
     CTA 클릭 처리 코드
  ========================================================= */
  const handlePrimary = () => {
    if (loggedIn) {
      navigate('/chat');
      return;
    }
    navigate('/signup');
  };

  const handleSecondary = () => {
    const target = document.getElementById('faq');
    if (!target) return;

    const offset = -96;
    const top = target.getBoundingClientRect().top + window.pageYOffset + offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  /* =========================================================
     가이드 캐릭터(곰 = bear) 데이터 가져오기
     - src/constants/mates.js 의 MATE_IMAGES / MATE_NAMES 사용
  ========================================================= */
  const guideImage = MATE_IMAGES.dog;
  const guideName = MATE_NAMES.dog;

  return (
    <section
      id="features"
      className="matey-features"
      aria-label="메이티 이용 방법"
    >
      {/* =========================================================
         배경 글로우
      ========================================================= */}
      <div className="matey-features__background" aria-hidden="true">
        <span className="matey-features__glow matey-features__glow--top" />
        <span className="matey-features__glow matey-features__glow--bottom" />
      </div>

      <div className="matey-features__inner">
        {/* =========================================================
           섹션 헤더 + 가이드 캐릭터
        ========================================================= */}
        <header className="matey-features__header">
          <div className="matey-features__header-copy">
            <span className="matey-features__eyebrow">
              <span className="matey-features__eyebrow-dot" />
              {FEATURES_COPY.eyebrow}
            </span>

            <h2 className="matey-features__title">
              <span className="matey-features__title-line">
                {FEATURES_COPY.titleTop}
              </span>
              <span className="matey-features__title-line matey-features__title-line--accent">
                {FEATURES_COPY.titleBottom}
              </span>
            </h2>

            <p className="matey-features__description">
              {FEATURES_COPY.description}
            </p>
          </div>

          <div className="matey-features__guide">
            <div className="matey-features__guide-bubble">
              {FEATURES_COPY.bubble}
              <span
                className="matey-features__guide-bubble-tail"
                aria-hidden="true"
              />
            </div>

            <div className="matey-features__guide-mate">
              <span
                className="matey-features__guide-mate-glow"
                aria-hidden="true"
              />
              <img
                src={guideImage}
                alt={`${guideName} 캐릭터`}
                className="matey-features__guide-mate-image"
                draggable={false}
              />
            </div>
          </div>
        </header>

        {/* =========================================================
           흐름 3단계 (Flow steps)
        ========================================================= */}
        <ol className="matey-features__flow" aria-label="메이티 사용 흐름 3단계">
          {FLOW_STEPS.map((step, index) => (
            <li key={step.id} className="matey-features__flow-item">
              <div className="matey-features__flow-card">
                <span className="matey-features__flow-number">
                  {step.number}
                </span>
                <h3 className="matey-features__flow-title">{step.title}</h3>
                <p className="matey-features__flow-text">{step.description}</p>
              </div>

              {index < FLOW_STEPS.length - 1 && (
                <span
                  className="matey-features__flow-connector"
                  aria-hidden="true"
                >
                  <span className="matey-features__flow-connector-line" />
                  <span className="matey-features__flow-connector-arrow">
                    →
                  </span>
                </span>
              )}
            </li>
          ))}
        </ol>

        {/* =========================================================
           특징 4가지 카드
        ========================================================= */}
        <ul className="matey-features__cards" aria-label="메이티 핵심 특징 4가지">
          {FEATURE_CARDS.map((card) => (
            <li
              key={card.id}
              className={`matey-features__card ${card.accent}`}
            >
              <span className="matey-features__card-icon" aria-hidden="true">
                {card.icon}
              </span>
              <h3 className="matey-features__card-title">{card.title}</h3>
              <p className="matey-features__card-text">{card.description}</p>
            </li>
          ))}
        </ul>

        {/* =========================================================
           하단 CTA 카드
        ========================================================= */}
        <div className="matey-features__cta">
          <div className="matey-features__cta-copy">
            <h3 className="matey-features__cta-title">
              {FEATURES_COPY.ctaTitle}
            </h3>
            <p className="matey-features__cta-description">
              {FEATURES_COPY.ctaDescription}
            </p>
          </div>

          <div className="matey-features__cta-actions">
            <button
              type="button"
              className="matey-features__cta-primary"
              onClick={handlePrimary}
            >
              {FEATURES_COPY.primaryLabel}
              <span
                className="matey-features__cta-arrow"
                aria-hidden="true"
              >
                →
              </span>
            </button>

            <button
              type="button"
              className="matey-features__cta-secondary"
              onClick={handleSecondary}
            >
              {FEATURES_COPY.secondaryLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
