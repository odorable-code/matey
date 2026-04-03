// src/components/4_Home/Features.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Features.css';

const FEATURES = [
  {
    id: 'emotion',
    icon: '💗',
    title: '감정을 먼저 읽어요',
    description: '짧게 말해도 지금 마음을 부드럽게 이해해줘요.',
    badge: '공감',
  },
  {
    id: 'character',
    icon: '🐰',
    title: '편한 톤으로 말해줘요',
    description: '하루, 루미처럼 내 취향에 맞는 메이트를 고를 수 있어요.',
    badge: '캐릭터',
  },
  {
    id: 'screen',
    icon: '🖥️',
    title: '화면도 같이 봐줘요',
    description: '설명하기 어려운 순간엔 화면을 보며 더 빠르게 도와줘요.',
    badge: '화면 도움',
  },
  {
    id: 'record',
    icon: '📘',
    title: '기록으로 다시 볼 수 있어요',
    description: '도움이 됐던 대화와 흐름을 나중에 편하게 꺼내볼 수 있어요.',
    badge: '기록',
  },
];

const QUICK_CHIPS = [
  '짧게 말해도 이해',
  '캐릭터별 분위기',
  '화면 기반 도움',
  '기록 다시 보기',
];

function Features() {
  const navigate = useNavigate();

  const moveToSection = (id) => {
    const target = document.getElementById(id);
    if (!target) return;

    const headerOffset = 96;
    const top =
      target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top,
      behavior: 'smooth',
    });
  };

  return (
    <section className="matey-features" id="features">
      <div className="matey-features__bg-orb matey-features__bg-orb--one" aria-hidden="true" />
      <div className="matey-features__bg-orb matey-features__bg-orb--two" aria-hidden="true" />

      <div className="matey-features__inner">
        <div className="matey-features__header">
          <span className="matey-features__badge">✨이용 방법</span>

          <h2 className="matey-features__title">
            메이티는 어렵지 않아요.
            <br />
            <span>이 4가지만 보면 바로 이해돼요</span>
          </h2>

          <p className="matey-features__subtitle">
            마음을 읽고, 편하게 말 걸어주고, 화면을 함께 보고,
            도움이 됐던 대화는 다시 볼 수 있어요.
          </p>
        </div>

        <div className="matey-features__hero-card">
          <div className="matey-features__hero-copy">
            <span className="matey-features__hero-label">처음 쓰는 사람을 위한 한 줄 요약</span>
            <h3>메이티는 “말 걸기 부담을 줄여주는 AI 메이트”예요</h3>
            <p>
              복잡한 기능보다, 지금 필요한 공감과 다음 한마디를
              자연스럽게 이어주는 데 집중했어요.
            </p>

            <div className="matey-features__chips">
              {QUICK_CHIPS.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          </div>

          <div className="matey-features__hero-actions">
            <button
              type="button"
              className="matey-features__button matey-features__button--primary"
              onClick={() => moveToSection('chat-demo')}
            >
              대화 예시 보기
            </button>

            <button
              type="button"
              className="matey-features__button matey-features__button--secondary"
              onClick={() => navigate('/signup')}
            >
              무료로 시작하기
            </button>
          </div>
        </div>

        <div className="matey-features__grid">
          {FEATURES.map((feature, index) => (
            <article className={`matey-features__card matey-features__card--${feature.id}`} key={feature.id}>
              <div className="matey-features__card-top">
                <span className="matey-features__card-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="matey-features__card-badge">{feature.badge}</span>
              </div>

              <div className="matey-features__card-icon" aria-hidden="true">
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>

        <div className="matey-features__bottom-note">
          <div className="matey-features__bottom-bubble">
            너무 길게 설명하지 않아도 괜찮아요.
            <br />
            메이티는 <strong>지금 상태를 먼저 이해하고, 편하게 이어주는 흐름</strong>에 집중해요.
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
