/**
 * =========================================================
 * 파일명 : src/components/4_Home/FAQ.jsx
 * 역할   : 메인 홈 화면의 FAQ(자주 묻는 질문) 섹션
 * 위치   : HomePage 내 Features 섹션 다음
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 좌측 인트로(헤드라인 + 고양이 캐릭터 + 말풍선) 표시
 * - 우측 콘텐츠 영역에 카테고리 탭(이용 방법 / 계정 / 채팅)과 아코디언 표시
 * - 카테고리 변경 시 해당 카테고리의 첫 질문이 자동으로 펼쳐짐
 * - 질문 클릭 시 펼침/닫힘 상태 토글
 *
 * [이번 수정 핵심]
 * - 캐릭터 데이터(이미지/이름)를 src/constants/mates.js 에서 가져와 사용
 *   → 이름/이미지 바뀌면 자동 반영
 * - 좌측 인트로와 우측 아코디언의 디자인 톤 통일
 * - 질문 카드 안의 이중 박스 제거, 카드 자체가 펼쳐지는 구조
 * - 카테고리 탭은 우측 상단 알약형 그룹으로 정리
 * - 활성 탭 / 펼친 질문 상태가 한눈에 보이도록 시각 강조
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) FAQ_COPY
 *    - 인트로 헤드라인 / 서브 카피 / 말풍선 멘트 변경
 *
 * 2) FAQ_CATEGORIES
 *    - 카테고리 탭 (key, label) 변경
 *
 * 3) FAQ_ITEMS
 *    - 질문/답변 데이터 변경 (category 값은 FAQ_CATEGORIES.key 와 매칭)
 *
 * 4) 캐릭터 정보(이미지/이름)는
 *    src/constants/mates.js 에서 수정
 */

import React, { useMemo, useState } from 'react';
import { MATE_IMAGES, MATE_NAMES } from '../../constants/mates';
import './FAQ.css';

/* =========================================================
   섹션 카피 코드
========================================================= */
const FAQ_COPY = {
  eyebrow: 'FAQ',
  titleTop: '궁금한 건 복잡하지 않게,',
  titleBottom: '바로 이해되게 정리해둘게요',
  description:
    '처음 시작 방법부터 계정, 대화 흐름까지 자주 헷갈리는 질문을 보기 쉽게 모아두었어요. 길게 찾지 않아도 핵심부터 바로 확인할 수 있어요.',
  bubble: '헷갈리는 게 생기면 내가 핵심부터 빠르게 짚어줄게.',
};

/* =========================================================
   카테고리 탭 코드
========================================================= */
const FAQ_CATEGORIES = [
  { key: 'guide', label: '이용 방법' },
  { key: 'account', label: '계정' },
  { key: 'chat', label: '채팅' },
];

/* =========================================================
   질문/답변 데이터 코드
========================================================= */
const FAQ_ITEMS = [
  {
    id: 1,
    category: 'guide',
    question: '메이티는 어떻게 시작하면 되나요?',
    answer:
      '처음이라면 무료체험이나 회원가입부터 가볍게 시작하면 돼요. 메이트를 먼저 둘러보고, 마음에 맞는 분위기를 찾은 뒤 대화를 시작하면 훨씬 편하게 느껴질 수 있어요.',
  },
  {
    id: 2,
    category: 'guide',
    question: '이용 방법 섹션에서는 무엇을 보면 되나요?',
    answer:
      '메이티가 어떤 흐름으로 도와주는지, 처음에는 어디서 시작하면 되는지, 어떤 경험을 기대할 수 있는지를 빠르게 이해할 수 있도록 핵심만 정리해 두었어요.',
  },
  {
    id: 3,
    category: 'guide',
    question: '처음 써보는 사람도 어렵지 않나요?',
    answer:
      '네. 긴 설명 없이도 부담 없이 시작할 수 있도록 무료체험 → 로그인 → 채팅 시작 흐름이 자연스럽게 이어지도록 구성했어요.',
  },
  {
    id: 4,
    category: 'account',
    question: '회원가입은 어디서 하나요?',
    answer:
      '헤더의 무료체험 버튼 또는 회원가입 페이지로 이동해서 가입할 수 있어요. 가입 후 로그인하면 채팅과 마이페이지를 더 자연스럽게 이용할 수 있어요.',
  },
  {
    id: 5,
    category: 'account',
    question: '로그인이 안 되면 어떻게 해야 하나요?',
    answer:
      '입력한 이메일과 비밀번호를 먼저 다시 확인해 주세요. 그래도 되지 않으면 비밀번호 재설정 흐름을 통해 다시 로그인할 수 있어요.',
  },
  {
    id: 6,
    category: 'account',
    question: '로그아웃은 어디서 하나요?',
    answer:
      '헤더 오른쪽 프로필 드롭다운 메뉴에서 로그아웃을 선택할 수 있어요.',
  },
  {
    id: 7,
    category: 'chat',
    question: '채팅은 어디서 시작하나요?',
    answer:
      '로그인한 회원이라면 헤더의 채팅하기 버튼이나 메인 Hero, 이용 방법 섹션의 CTA를 통해 채팅 화면으로 이동할 수 있어요.',
  },
  {
    id: 8,
    category: 'chat',
    question: '비회원도 바로 채팅할 수 있나요?',
    answer:
      '현재 메인 흐름에서는 비회원에게 무료체험 또는 회원가입을 먼저 보여주고, 로그인 후 채팅으로 이어지는 구성이 가장 자연스러워요.',
  },
  {
    id: 9,
    category: 'chat',
    question: '대화 기록은 나중에 다시 볼 수 있나요?',
    answer:
      '서비스 구조에 따라 기록 기능을 연결하면 도움이 되었던 대화 흐름이나 기억해 두고 싶은 내용을 나중에 다시 확인할 수 있어요.',
  },
];

function FAQ() {
  /* =========================================================
     상태 관리 코드
     - activeCategory : 현재 활성 카테고리 키
     - openItemId     : 현재 펼쳐진 질문 ID (null = 모두 닫힘)
  ========================================================= */
  const [activeCategory, setActiveCategory] = useState('guide');
  const [openItemId, setOpenItemId] = useState(1);

  /* =========================================================
     활성 카테고리에 해당하는 질문만 필터링
  ========================================================= */
  const filteredItems = useMemo(
    () => FAQ_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  /* =========================================================
     카테고리 변경 처리
     - 카테고리 변경 시 해당 카테고리의 첫 질문 자동 펼침
  ========================================================= */
  const handleCategoryChange = (categoryKey) => {
    setActiveCategory(categoryKey);
    const firstItem = FAQ_ITEMS.find((item) => item.category === categoryKey);
    setOpenItemId(firstItem?.id ?? null);
  };

  /* =========================================================
     질문 펼침/닫힘 토글
  ========================================================= */
  const handleToggleItem = (itemId) => {
    setOpenItemId((prev) => (prev === itemId ? null : itemId));
  };

  /* =========================================================
     가이드 캐릭터(고양이 = cat) 데이터 가져오기
     - src/constants/mates.js 의 MATE_IMAGES / MATE_NAMES 사용
  ========================================================= */
  const guideImage = MATE_IMAGES.dog;
  const guideName = MATE_NAMES.dog;

  return (
    <section id="faq" className="matey-faq" aria-label="자주 묻는 질문">
      {/* =========================================================
         배경 글로우 레이어
      ========================================================= */}
      <div className="matey-faq__background" aria-hidden="true">
        <span className="matey-faq__glow matey-faq__glow--top" />
        <span className="matey-faq__glow matey-faq__glow--bottom" />
      </div>

      <div className="matey-faq__inner">
        {/* =========================================================
           좌측 - 인트로 영역
        ========================================================= */}
        <aside className="matey-faq__intro">
          <span className="matey-faq__eyebrow">
            <span className="matey-faq__eyebrow-dot" />
            {FAQ_COPY.eyebrow}
          </span>

          <h2 className="matey-faq__title">
            <span className="matey-faq__title-line">{FAQ_COPY.titleTop}</span>
            <span className="matey-faq__title-line matey-faq__title-line--accent">
              {FAQ_COPY.titleBottom}
            </span>
          </h2>

          <p className="matey-faq__description">{FAQ_COPY.description}</p>

          <div className="matey-faq__guide">
            <div className="matey-faq__guide-bubble">
              {FAQ_COPY.bubble}
              <span
                className="matey-faq__guide-bubble-tail"
                aria-hidden="true"
              />
            </div>

            <div className="matey-faq__guide-mate">
              <span
                className="matey-faq__guide-mate-glow"
                aria-hidden="true"
              />
              <img
                src={guideImage}
                alt={`${guideName} 캐릭터`}
                className="matey-faq__guide-mate-image"
                draggable={false}
              />
            </div>
          </div>
        </aside>

        {/* =========================================================
           우측 - 콘텐츠 영역(탭 + 아코디언)
        ========================================================= */}
        <div className="matey-faq__content">
          {/* 카테고리 탭 */}
          <div
            className="matey-faq__tabs"
            role="tablist"
            aria-label="FAQ 카테고리"
          >
            {FAQ_CATEGORIES.map((category) => {
              const isActive = category.key === activeCategory;
              return (
                <button
                  key={category.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`matey-faq__tab ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleCategoryChange(category.key)}
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          {/* 아코디언 리스트 */}
          <ul className="matey-faq__list" role="list">
            {filteredItems.map((item) => {
              const isOpen = item.id === openItemId;
              return (
                <li
                  key={item.id}
                  className={`matey-faq__item ${isOpen ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    className="matey-faq__question"
                    onClick={() => handleToggleItem(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                  >
                    <span className="matey-faq__question-text">
                      {item.question}
                    </span>
                    <span
                      className="matey-faq__question-icon"
                      aria-hidden="true"
                    >
                      <span className="matey-faq__question-icon-bar matey-faq__question-icon-bar--horizontal" />
                      <span className="matey-faq__question-icon-bar matey-faq__question-icon-bar--vertical" />
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${item.id}`}
                    className="matey-faq__answer-wrap"
                    role="region"
                    aria-hidden={!isOpen}
                  >
                    <p className="matey-faq__answer">{item.answer}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default FAQ;
