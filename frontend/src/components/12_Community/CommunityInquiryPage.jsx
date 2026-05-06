import React from 'react';
import { Link } from 'react-router-dom';
import CommunityInquirySection from './CommunityInquirySection';
import styles from './CommunityPage.module.css';

/** 일반 문의 전용 화면 (FAQ와 메뉴 분리) */
function CommunityInquiryPage() {
  return (
    <div>
      <div className={styles.subPageBar}>
        <Link to="/community" className={styles.backLink}>
          ← 커뮤니티
        </Link>
      </div>
      <h1 className={styles.pageTitle}>문의</h1>
      <p className={styles.pageSubtitle} style={{ marginBottom: 20 }}>
        서비스 이용·계정·오류 등 문의를 남기면 관리자가 확인 후 답변해요. 게시글·댓글 신고는 글 상세의 신고
        버튼을 이용해 주세요.
      </p>
      <CommunityInquirySection showIntro={false} loginReturnTo="/community/inquiry" />
    </div>
  );
}

export default CommunityInquiryPage;
