import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MATE_BUBBLES, MATE_IMAGES, MATE_NAMES } from '../constants/mates';
import '../components/2_Footer/Footer.css';

const COPY = {
  ctaTitle: '오늘은 가볍게 한 줄부터 시작해볼까요?',
  ctaDescription:
    '처음이라면 무료체험부터, 궁금한 게 남아 있다면 FAQ부터 보면 돼요.',
  primaryLabel: '대화 시작하기',
};

/**
 * 예전 푸터 상단에 있던 마무리 CTA 카드 — 메인(/)에서만 쓰임.
 */
function HomeClosingCta() {
  const navigate = useNavigate();
  const guideImage = MATE_IMAGES.dog;
  const guideName = MATE_NAMES.dog;

  const handlePrimary = () => {
    navigate('/free-trial');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="matey-home__closing-wrap" aria-label="대화 시작 안내">
      <div className="matey-home__closing-inner">
        <section className="matey-footer__cta">
          <div className="matey-footer__cta-copy">
            <span className="matey-footer__cta-eyebrow">
              <span className="matey-footer__cta-eyebrow-dot" />
              홈 · 마무리 전 한 번 더
            </span>

            <h2 className="matey-footer__cta-title">{COPY.ctaTitle}</h2>

            <p className="matey-footer__cta-description">{COPY.ctaDescription}</p>

            <div className="matey-footer__cta-actions">
              <button
                type="button"
                className="matey-footer__cta-primary"
                onClick={handlePrimary}
              >
                {COPY.primaryLabel}
                <span className="matey-footer__cta-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          </div>

          <div className="matey-footer__cta-mate">
            <div className="matey-footer__cta-bubble">
              {MATE_BUBBLES.dog}
              <span className="matey-footer__cta-bubble-tail" aria-hidden="true" />
            </div>

            <div className="matey-footer__cta-mate-image-wrap">
              <span className="matey-footer__cta-mate-glow" aria-hidden="true" />
              <img
                src={guideImage}
                alt={`${guideName} 캐릭터`}
                className="matey-footer__cta-mate-image"
                draggable={false}
              />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default HomeClosingCta;
