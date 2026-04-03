import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Pricing.css';

const pricingPlans = [
  {
    id: 1,
    name: '무료',
    emoji: '🌱',
    price: '0',
    period: '영구',
    description: '메이티를 처음 가볍게 경험해보는 플랜',
    badge: null,
    accent: 'blue',
    note: '처음 시작하는 사용자에게 추천',
    features: [
      { text: '하루 대화 5회', included: true },
      { text: '기본 캐릭터 2종 선택', included: true },
      { text: '기본 감정 분석', included: true },
      { text: '대화 기록 7일 보관', included: true },
      { text: '화면 맥락 인식', included: false },
      { text: '고급 감정 리포트', included: false },
      { text: '우선 지원', included: false },
    ],
    cta: '무료로 시작하기',
    signupPath: '/signup',
  },
  {
    id: 2,
    name: 'Pro',
    emoji: '⭐',
    price: '9,900',
    period: '/월',
    description: '메이티의 핵심 기능을 가장 균형 있게 쓰는 플랜',
    badge: '가장 인기',
    accent: 'purple',
    note: '대부분의 사용자에게 가장 잘 맞는 선택',
    features: [
      { text: '무제한 대화', included: true },
      { text: '전체 캐릭터 톤 커스터마이징', included: true },
      { text: '고급 감정 분석 & 주간 리포트', included: true },
      { text: '대화 기록 무제한 보관', included: true },
      { text: '화면 맥락 인식', included: true },
      { text: '고급 감정 리포트 & AI 인사이트', included: true },
      { text: '우선 지원', included: false },
    ],
    cta: 'Pro 시작하기',
    signupPath: '/signup?plan=pro',
  },
  {
    id: 3,
    name: 'Care+',
    emoji: '💎',
    price: '19,900',
    period: '/월',
    description: '더 깊은 개인화와 리포트를 원하는 플랜',
    badge: '깊이 있는 케어',
    accent: 'pink',
    note: '리포트와 세밀한 관리가 중요한 사용자에게 추천',
    features: [
      { text: '무제한 대화', included: true },
      { text: '프리미엄 캐릭터 & 세부 성향 설정', included: true },
      { text: '심층 감정 리포트', included: true },
      { text: '대화 기록 무제한 보관', included: true },
      { text: '화면 맥락 인식', included: true },
      { text: '일일 요약 & 맞춤 AI 인사이트', included: true },
      { text: '우선 지원', included: true },
    ],
    cta: 'Care+ 시작하기',
    signupPath: '/signup?plan=care-plus',
  },
];

function Pricing() {
  const navigate = useNavigate();

  return (
    <section className="matey-pricing" id="pricing">
      <div className="matey-pricing__inner">
        <div className="matey-pricing__header">
          <div className="matey-pricing__badge">
            <span className="matey-pricing__badge-dot" />
            요금제
          </div>

          <h2 className="matey-pricing__title">
            가볍게 시작하고,
            <br />
            <span>필요할 때 더 깊게 연결하세요</span>
          </h2>

          <p className="matey-pricing__subtitle">
            메이티는 처음엔 부담 없이 시작하고, 익숙해질수록 더 깊게 사용할 수 있도록
            설계했어요. 무료로 감각을 익힌 뒤, 나에게 맞는 케어 강도를 선택해보세요.
          </p>
        </div>

        <div className="matey-pricing__grid">
          {pricingPlans.map((plan) => (
            <article
              key={plan.id}
              className={`matey-pricing__card matey-pricing__card--${plan.accent} ${
                plan.badge ? 'is-featured' : ''
              }`}
            >
              {plan.badge && <div className="matey-pricing__card-badge">{plan.badge}</div>}

              <div className="matey-pricing__card-top">
                <div className="matey-pricing__plan-chip">
                  <span>{plan.emoji}</span>
                  <span>{plan.name}</span>
                </div>

                <div className="matey-pricing__price-wrap">
                  <div className="matey-pricing__price-line">
                    <strong>₩{plan.price}</strong>
                    <span>{plan.period}</span>
                  </div>
                  <p>{plan.description}</p>
                </div>
              </div>

              <div className="matey-pricing__divider" />

              <ul className="matey-pricing__feature-list">
                {plan.features.map((feature) => (
                  <li
                    key={feature.text}
                    className={`matey-pricing__feature-item ${
                      feature.included ? 'included' : 'excluded'
                    }`}
                  >
                    <span className="matey-pricing__feature-icon">
                      {feature.included ? '✓' : '–'}
                    </span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <div className="matey-pricing__note">{plan.note}</div>

              <button
                type="button"
                className={`matey-pricing__cta matey-pricing__cta--${plan.accent}`}
                onClick={() => navigate(plan.signupPath)}
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </div>

        <div className="matey-pricing__footnote">
          <div className="matey-pricing__footnote-card">
            <strong>언제든 변경 가능</strong>
            <span>무료로 시작한 뒤 Pro / Care+로 자연스럽게 확장할 수 있어요.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Pricing;
