import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supportUserAPI } from '../../../utils/api';
import {
  displaySupportTicketTitle,
  parseSupportReportForDisplay,
} from '../../../utils/supportReportDisplay';
import styles from './SupportHistoryContent.module.css';

function formatWhen(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    return value.replace('T', ' ').slice(0, 16);
  }
  return String(value);
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
          {filtered.map((row) => {
            const isReport = isReportRow(row);
            const reportView = isReport ? parseSupportReportForDisplay(row) : null;
            const cardTitle = isReport
              ? reportView.userTitle
              : displaySupportTicketTitle(row.title);

            return (
              <div
                key={row.supportId}
                role="button"
                tabIndex={0}
                className={`${styles.card} ${openId === row.supportId ? styles.cardOpen : ''}`}
                onClick={() => setOpenId((prev) => (prev === row.supportId ? null : row.supportId))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOpenId((prev) => (prev === row.supportId ? null : row.supportId));
                  }
                }}
              >
                <div className={styles.cardHead}>
                  <h2 className={styles.title}>{cardTitle}</h2>
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
                  <div className={styles.detail} onClick={(e) => e.stopPropagation()}>
                    {isReport && reportView ? (
                      <div className={styles.reportDetail}>
                        {reportView.reasonName ? (
                          <div className={styles.kv}>
                            <span className={styles.k}>신고 사유</span>
                            <span className={styles.v}>{reportView.reasonName}</span>
                          </div>
                        ) : null}
                        {reportView.targetType === 'POST' ? (
                          <>
                            {reportView.postTitle ? (
                              <div className={styles.kv}>
                                <span className={styles.k}>게시글 제목</span>
                                <span className={styles.v}>{reportView.postTitle}</span>
                              </div>
                            ) : null}
                            {reportView.postAuthor ? (
                              <div className={styles.kv}>
                                <span className={styles.k}>게시글 작성자</span>
                                <span className={styles.v}>{reportView.postAuthor}</span>
                              </div>
                            ) : null}
                          </>
                        ) : null}
                        {reportView.targetType === 'COMMENT' && reportView.commentAuthor ? (
                          <div className={styles.kv}>
                            <span className={styles.k}>댓글 작성자</span>
                            <span className={styles.v}>{reportView.commentAuthor}</span>
                          </div>
                        ) : null}
                        {reportView.reportBody ? (
                          <div className={styles.kv}>
                            <span className={styles.k}>신고 내용</span>
                            <p className={styles.reportBody}>{reportView.reportBody}</p>
                          </div>
                        ) : null}
                        {reportView.linkPostId != null ? (
                          <Link
                            className={styles.gotoBtn}
                            to={`/community/posts/${reportView.linkPostId}${
                              reportView.linkHash ? `#${reportView.linkHash}` : ''
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {reportView.targetType === 'COMMENT'
                              ? '신고한 댓글로 이동'
                              : '해당 게시글로 이동'}
                          </Link>
                        ) : null}
                      </div>
                    ) : row.content ? (
                      <p className={styles.body}>{row.content}</p>
                    ) : null}
                    {row.answerContent ? (
                      <div className={styles.answerBlock}>
                        <div className={styles.answerLabel}>관리자 답변</div>
                        <p className={styles.answerBody}>{row.answerContent}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

export default SupportHistoryContent;
