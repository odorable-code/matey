/**
 * [파일 역할]
 * - MyPage 페이지 진입용 파일
 * - 실제 내용은 MyPageContainer가 담당
 *
 * [여기서 찾을 것]
 * - 보통 크게 수정할 일은 없음
 *
 * [수정 포인트]
 * - 페이지 시작 시 다른 래퍼를 씌우고 싶으면 여기서 수정
 * - 현재는 MyPageContainer만 그대로 출력하는 가장 단순한 구조
 */

import React from 'react';
import MyPageContainer from './MyPageContainer';

function MyPage() {
  /* =========================
     마이페이지 메인 컨테이너 연결
  ========================= */
  return <MyPageContainer />;
}

export default MyPage;
