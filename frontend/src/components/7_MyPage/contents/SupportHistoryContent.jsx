import React, { useEffect, useState } from 'react';
import { supportUserAPI } from '../../../utils/api';
import styles from './SupportHistoryContent.module.css';

function formatWhen(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    return value.replace('T', ' ').slice(0, 16);
  }
  return String(value);
}

function SupportHistoryContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await supportUserAPI.listTickets();
        const list = res?.items ?? res?.supportList ?? [];
        setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || '목록을 불러오지 못했어요.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <article className="mypage-support-history" data-reveal-skip="true">
      <h1 className={styles.pageTitle}>문의 내역</h1>
      <p className={styles.lead}>
        커뮤니티 문의 메뉴로 남긴 일반 문의와 게시글·댓글 신고 접수가 여기 모여요. 관리자 답변이 등록되면 같은 카드에
        표시돼요.
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.empty}>불러오는 중이에요…</p> : null}

      {!loading && items.length === 0 ? (
        <p className={styles.empty}>아직 접수한 내역이 없어요.</p>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className={styles.list}>
          {items.map((row) => (
            <div key={row.supportId} className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.title}>{row.title || '제목 없음'}</h2>
                <span
                  className={`${styles.badge} ${
                    String(row.status || '').toUpperCase() === 'DONE'
                      ? styles.badgeDone
                      : styles.badgePending
                  }`}
                >
                  {String(row.status || '').toUpperCase() === 'DONE' ? '답변 완료' : '처리 중'}
                </span>
              </div>
              <div className={styles.meta}>
                {row.reasonName ? `${row.reasonName} · ` : ''}
                {formatWhen(row.createdAt)}
              </div>
              <p className={styles.body}>{row.content}</p>
              {row.answerContent ? (
                <div className={styles.answerBlock}>
                  <div className={styles.answerLabel}>관리자 답변</div>
                  <p className={styles.answerBody}>{row.answerContent}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default SupportHistoryContent;
