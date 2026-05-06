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

function displayTitle(raw) {
  const t = String(raw || '');
  // 중복 신고 방지용 메타 태그는 UI에서 숨김: [REPORT POST 123] ...
  const withoutMeta = t.replace(/^\[REPORT\s+(POST|COMMENT)\s+\d+\]\s*/i, '');
  // "게시글 신고: ", "댓글 신고:" 접두사도 숨기고 실제 제목만 남긴다.
  return withoutMeta.replace(/^(게시글 신고:|댓글 신고:)\s*/i, '');
}

function isReportRow(row) {
  // 1) 백엔드가 내려주는 targetType 우선
  const tt = String(row?.targetType || '').trim().toUpperCase();
  if (tt === 'POST' || tt === 'COMMENT') return true;
  // 2) 혹시 targetType이 비어있는 구버전 응답이면 title 메타로 판별
  const title = String(row?.title || '');
  return /^\[REPORT\s+(POST|COMMENT)\s+\d+\]/i.test(title);
}

function SupportHistoryContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('INQUIRY'); // INQUIRY | REPORT
  const [openId, setOpenId] = useState(null);

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

  const filtered = (items || []).filter((row) => (tab === 'REPORT' ? isReportRow(row) : !isReportRow(row)));

  return (
    <article className="mypage-support-history" data-reveal-skip="true">
      <h1 className={styles.pageTitle}>문의·신고함</h1>

      <div className={styles.tabRow} role="tablist" aria-label="문의·신고 전환">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'INQUIRY'}
          className={`${styles.tabBtn} ${tab === 'INQUIRY' ? styles.tabBtnActive : ''}`}
          onClick={() => setTab('INQUIRY')}
        >
          문의
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'REPORT'}
          className={`${styles.tabBtn} ${tab === 'REPORT' ? styles.tabBtnActive : ''}`}
          onClick={() => setTab('REPORT')}
        >
          신고
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.empty}>불러오는 중이에요…</p> : null}

      {!loading && filtered.length === 0 ? (
        <p className={styles.empty}>아직 {tab === 'REPORT' ? '신고' : '문의'} 내역이 없어요.</p>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className={styles.list}>
          {filtered.map((row) => (
            <button
              key={row.supportId}
              type="button"
              className={`${styles.card} ${openId === row.supportId ? styles.cardOpen : ''}`}
              onClick={() => setOpenId((prev) => (prev === row.supportId ? null : row.supportId))}
            >
              <div className={styles.cardHead}>
                <h2 className={styles.title}>{displayTitle(row.title) || '제목 없음'}</h2>
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
                {formatWhen(row.createdAt)}
              </div>
              {openId === row.supportId ? (
                <div className={styles.detail}>
                  {row.content ? <p className={styles.body}>{row.content}</p> : null}
                  {row.answerContent ? (
                    <div className={styles.answerBlock}>
                      <div className={styles.answerLabel}>관리자 답변</div>
                      <p className={styles.answerBody}>{row.answerContent}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default SupportHistoryContent;
