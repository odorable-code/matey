import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supportPublicAPI } from '../../utils/api';
import styles from './CommunityPage.module.css';

function CommunityFaqView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await supportPublicAPI.getFaqList();
        const list = res?.faq ?? res?.items ?? res;
        setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'FAQ를 불러오지 못했어요.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className={styles.subPageBar}>
        <Link to="/community" className={styles.backLink}>
          ← 커뮤니티
        </Link>
      </div>
      <h1 className={styles.pageTitle}>FAQ</h1>
      <p className={styles.pageSubtitle} style={{ marginBottom: 20 }}>
        자주 묻는 질문은 운영팀이 관리해요. 일반 문의는 왼쪽 메뉴의 <strong>문의</strong>에서 접수해 주세요.
        게시글·댓글 신고는 해당 글 상세 화면의 신고 버튼을 이용해 주세요.
      </p>
      {error ? <p className={styles.errorText}>{error}</p> : null}
      {loading ? (
        <p className={styles.hint}>불러오는 중이에요…</p>
      ) : items.length === 0 ? (
        <p className={styles.hint}>등록된 FAQ가 아직 없어요.</p>
      ) : (
        items.map((item) => (
          <details key={item.faqId || item.question} className={styles.faqItem}>
            <summary className={styles.faqSummary}>{item.question}</summary>
            <div className={styles.faqBody}>{item.answer}</div>
          </details>
        ))
      )}
    </div>
  );
}

export default CommunityFaqView;
