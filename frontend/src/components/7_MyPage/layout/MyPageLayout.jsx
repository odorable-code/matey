/**
 * [파일 역할]
 * - 마이페이지 공통 레이아웃 컴포넌트
 * - 왼쪽 사이드바와 오른쪽 본문을 2단 구조로 배치
 *
 * [여기서 찾을 것]
 * - 왼쪽 영역: sidebar
 * - 오른쪽 영역: content
 *
 * [수정 포인트]
 * - 전체 레이아웃 구조를 바꾸고 싶으면 여기 수정
 * - 클래스 스타일은 MyPageLayout.module.css에서 수정
 */

import React from 'react';
import styles from './MyPageLayout.module.css';

function MyPageLayout({ sidebar, content }) {
  /* =========================
     전체 2단 레이아웃 구조
     - sidebar: 왼쪽 메뉴/프로필
     - content: 오른쪽 메인 콘텐츠
  ========================= */
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <aside className={styles.sidebar}>{sidebar}</aside>
        <section className={styles.content}>{content}</section>
      </div>
    </main>
  );
}

export default MyPageLayout;
