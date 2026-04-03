import React, { useMemo, useState } from 'react';
import './FAQ.css';

const FAQ_CATEGORIES = [
  {
    id: 'general',
    label: '기본 이용',
    items: [
      {
        id: 'general-1',
        question: '메이티는 어떤 서비스인가요?',
        answer:
          '메이티는 감정 공감, 대화 정리, 화면 기반 도움을 자연스럽게 연결해주는 AI 메이트예요. 일상에서 마음이 복잡할 때, 해야 할 일이 막막할 때, 또는 누군가 먼저 말을 걸어주면 좋겠는 순간에 부담 없이 대화를 시작할 수 있도록 설계되어 있어요.',
      },
      {
        id: 'general-2',
        question: '처음 시작할 때 어렵지 않나요?',
        answer:
          '어렵지 않아요. 계정을 만들고 메이트를 고르면 바로 시작할 수 있어요. 복잡한 설정이나 긴 학습 과정 없이, 바로 대화하고 필요한 기능을 체험할 수 있도록 구성했어요.',
      },
      {
        id: 'general-3',
        question: '웹에서도 사용할 수 있나요?',
        answer:
          '네. 현재 Web 환경에서 바로 시작할 수 있고, 모바일 환경은 준비 중이에요. 사용 흐름이 어렵지 않도록 어느 화면에서도 부드럽게 이어지는 경험을 목표로 하고 있어요.',
      },
    ],
  },
  {
    id: 'conversation',
    label: '대화 경험',
    items: [
      {
        id: 'conversation-1',
        question: '캐릭터마다 차이가 있나요?',
        answer:
          '있어요. 하루는 조금 더 차분하게 정리해주는 타입이고, 루미는 조금 더 다정하고 부드럽게 다가오는 타입이에요. 같은 상황이라도 캐릭터에 따라 말투와 반응 분위기가 달라져서 더 편한 쪽을 선택할 수 있어요.',
      },
      {
        id: 'conversation-2',
        question: '선택지로만 대화해야 하나요?',
        answer:
          '아니요. 선택지는 대화를 더 쉽게 시작할 수 있도록 돕는 장치일 뿐이고, 직접 입력도 언제든 가능해요. 말문이 막힐 때는 선택지로 시작하고, 익숙해지면 자유롭게 입력하는 방식으로 사용할 수 있어요.',
      },
      {
        id: 'conversation-3',
        question: '감정 분석은 어떻게 활용되나요?',
        answer:
          '대화 중에 드러나는 감정 흐름과 맥락을 바탕으로 더 자연스럽고 맞춤형인 반응을 제공하는 데 활용돼요. 단순히 키워드만 읽는 것이 아니라, 사용자의 현재 상태를 더 부드럽게 이해하려는 방향으로 작동해요.',
      },
    ],
  },
  {
    id: 'plans',
    label: '요금제',
    items: [
      {
        id: 'plans-1',
        question: '무료 플랜으로도 충분히 써볼 수 있나요?',
        answer:
          '네. 무료 플랜에서도 메이티의 핵심 대화 경험을 가볍게 체험할 수 있어요. 처음 서비스가 나와 맞는지 확인해보고, 더 많은 대화나 확장 기능이 필요할 때 상위 플랜으로 넘어갈 수 있어요.',
      },
      {
        id: 'plans-2',
        question: 'Pro와 Care+의 차이는 무엇인가요?',
        answer:
          'Pro는 본격적으로 메이티를 자주 사용하는 분들을 위한 플랜이고, Care+는 더 깊은 감정 리포트와 우선 지원까지 포함된 확장형 플랜이에요. 사용 빈도와 원하는 기능 깊이에 따라 선택하면 돼요.',
      },
      {
        id: 'plans-3',
        question: '나중에 플랜을 바꿀 수 있나요?',
        answer:
          '네. 처음에는 가볍게 시작하고, 필요에 따라 상위 플랜으로 확장하는 흐름을 염두에 두고 설계했어요. 서비스에 익숙해진 뒤 내 사용 패턴에 맞게 조정하면 돼요.',
      },
    ],
  },
  {
    id: 'privacy',
    label: '기록 & 안심',
    items: [
      {
        id: 'privacy-1',
        question: '대화 기록은 다시 볼 수 있나요?',
        answer:
          '플랜에 따라 보관 기간과 범위는 다르지만, 메이티는 사용자가 필요할 때 이전 대화를 다시 확인하고 감정 흐름을 돌아볼 수 있도록 기록 기능을 제공해요.',
      },
      {
        id: 'privacy-2',
        question: '화면 인식 기능은 어떤 상황에서 쓰나요?',
        answer:
          '에러 화면, 문서 화면, 과제 화면처럼 말로 설명하기 번거로운 장면에서 유용해요. 텍스트로 길게 설명하지 않아도 맥락을 더 빠르게 이해할 수 있도록 돕는 기능이에요.',
      },
      {
        id: 'privacy-3',
        question: '메이티는 왜 이렇게 인터페이스가 부드럽게 느껴지나요?',
        answer:
          '사용자가 긴장하거나 부담을 느끼지 않도록, 강한 경고성 인터페이스보다 부드러운 색감과 카드 구조, 작은 선택지 중심의 흐름으로 설계했기 때문이에요. 말 걸기 쉬운 분위기 자체를 중요한 경험으로 보고 있어요.',
      },
    ],
  },
];

function FAQ() {
  const [activeCategory, setActiveCategory] = useState(FAQ_CATEGORIES[0].id);
  const [openItemId, setOpenItemId] = useState(FAQ_CATEGORIES[0].items[0].id);

  const currentCategory = useMemo(
    () =>
      FAQ_CATEGORIES.find((category) => category.id === activeCategory) ||
      FAQ_CATEGORIES[0],
    [activeCategory]
  );

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    const nextCategory =
      FAQ_CATEGORIES.find((category) => category.id === categoryId) || FAQ_CATEGORIES[0];
    setOpenItemId(nextCategory.items[0].id);
  };

  const handleToggle = (itemId) => {
    setOpenItemId((prev) => (prev === itemId ? '' : itemId));
  };

  return (
    <section className="matey-faq" id="faq">
      <div className="matey-faq__inner">
        <div className="matey-faq__header">
          <span className="matey-faq__badge">FAQ</span>
          <h2 className="matey-faq__title">
            자주 묻는 질문을
            <br />
            <span>읽기 편하게 정리했어요</span>
          </h2>
          <p className="matey-faq__subtitle">
            처음 시작하는 분들이 가장 자주 궁금해하는 내용을
            복잡하지 않게, 한눈에 확인할 수 있도록 정리했어요.
          </p>
        </div>

        <div className="matey-faq__tabs" role="tablist" aria-label="FAQ 카테고리">
          {FAQ_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === category.id}
              className={`matey-faq__tab ${activeCategory === category.id ? 'is-active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="matey-faq__accordion">
          {currentCategory.items.map((item, index) => {
            const isOpen = openItemId === item.id;

            return (
              <article
                key={item.id}
                className={`matey-faq__item ${isOpen ? 'is-open' : ''}`}
                style={{ '--faq-delay': `${index * 0.04}s` }}
              >
                <button
                  type="button"
                  className="matey-faq__question"
                  onClick={() => handleToggle(item.id)}
                  aria-expanded={isOpen}
                >
                  <span className="matey-faq__question-text">{item.question}</span>
                  <span className="matey-faq__icon" aria-hidden="true" />
                </button>

                <div className={`matey-faq__answer-wrap ${isOpen ? 'is-open' : ''}`}>
                  <div className="matey-faq__answer">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
