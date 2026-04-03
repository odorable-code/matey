// src/components/4_Home/Hero.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const HERO_CHARACTERS = [
  {
    id: 'rabbit',
    name: '하루',
    role: '차분하게 정리해주는 메이트',
    image: '/images/rabbit.png',
    message:
      '오늘 조금 복잡해 보이네요. 괜찮다면 지금 가장 마음에 걸리는 것부터 천천히 말해줘도 돼요.',
    tone: 'blue',
  },
  {
    id: 'cat',
    name: '루미',
    role: '다정하게 먼저 다가오는 메이트',
    image: '/images/cat.png',
    message:
      '완벽하게 설명하지 않아도 괜찮아요. 지금 기분이 어떤지만 말해줘도 내가 같이 정리해줄게요.',
    tone: 'pink',
  },
];

function Hero() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const activeCharacter = useMemo(
    () => HERO_CHARACTERS[activeIndex],
    [activeIndex]
  );

  useEffect(() => {
    let fadeTimer;
    let switchTimer;

    const startCycle = () => {
      fadeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 3200);

      switchTimer = setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % HERO_CHARACTERS.length);
        setIsVisible(true);
      }, 4000);
    };

    startCycle();
    const interval = setInterval(startCycle, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(switchTimer);
      clearInterval(interval);
    };
  }, []);

  const moveToSection = (id) => {
    const target = document.getElementById(id);
    if (!target) return;

    const headerOffset = 84;
    const top =
      target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top,
      behavior: 'smooth',
    });
  };

  return (
    <section className="matey-hero" id="hero">
      <div className="matey-hero__inner">
        <div className="matey-hero__content">
          <span className="matey-hero__badge">감정을 먼저 이해하는 AI 메이트</span>

          <h1 className="matey-hero__title">
            힘든 순간에도,
            <br />
            <span>메이티는 먼저
              <br />
              다정하게
              <br />
              말을 걸어요</span>
          </h1>

          <p className="matey-hero__description">
            메이티는 감정 공감, 대화 정리, 화면 기반 도움을 자연스럽게 연결해주는
            AI 메이트예요.
            <br />
            너무 길게 설명하지 않아도 지금 상황을 이해하고,
            부담 없는 다음 한마디를 함께 찾아드려요.
          </p>

          <div className="matey-hero__actions">
            <button
              type="button"
              className="matey-hero__button matey-hero__button--primary"
              onClick={() => navigate('/signup')}
            >
              무료로 시작하기
            </button>

            <button
              type="button"
              className="matey-hero__button matey-hero__button--secondary"
              onClick={() => moveToSection('chat-demo')}
            >
              대화 예시 보기
            </button>
          </div>

          <div className="matey-hero__platforms">
            <span className="matey-hero__platform-chip">Web 바로 시작 가능</span>
            <span className="matey-hero__platform-chip">iOS 준비중</span>
            <span className="matey-hero__platform-chip">Android 준비중</span>
          </div>
        </div>

        <div className="matey-hero__visual" aria-hidden="true">
          <div className="matey-hero__visual-glow matey-hero__visual-glow--one" />
          <div className="matey-hero__visual-glow matey-hero__visual-glow--two" />

          <div
            className={`matey-hero__character-scene is-${activeCharacter.tone} ${
              isVisible ? 'is-visible' : 'is-hidden'
            }`}
          >
            <div className="matey-hero__speech">
              <p>{activeCharacter.message}</p>
            </div>

            <div className="matey-hero__character-wrap">
              <div className="matey-hero__character-shadow" />
              <img
                src={activeCharacter.image}
                alt={activeCharacter.name}
                className="matey-hero__character-image"
              />
              <div className="matey-hero__character-meta">
                <strong>{activeCharacter.name}</strong>
                <span>{activeCharacter.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
