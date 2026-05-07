import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supportUserAPI } from '../../../utils/api';
import {
  displaySupportTicketTitle,
  getReportCardTitle,
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
  const tt = String(row?.targetType || '').trim().toUpperCase();
  if (tt === 'POST' || tt === 'COMMENT') return true;
  const title = String(row?.title || '');
  if (/^\[REPORT\s+(POST|COMMENT)\s+\d+\]/i.test(title)) return true;
  if (/^\[\s*(게시글|댓글)\s*신고\s*\]/i.test(title)) return true;
  return false;
}

function SupportHistoryContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('INQUIRY'); // INQUIRY | REPORT
  const [openId, setOpenId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await supportUserAPI.listTickets();
        const list = res?.items ?? res?.supportList ?? [];
        if (!cancelled) setItems(Array.isArray(list) ? list : []);
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

  const handleDelete = async (event, supportId) => {
    event.stopPropagation();
    if (!window.confirm('이 내역을 삭제할까요? 삭제하면 복구할 수 없어요.')) return;
    setDeletingId(supportId);
    setError('');
    try {
      await supportUserAPI.deleteTicket(supportId);
      setItems((prev) => prev.filter((r) => Number(r.supportId) !== Number(supportId)));
      setOpenId((prev) => (prev === supportId ? null : prev));
    } catch (e) {
      setError(e?.message || '삭제에 실패했어요.');
    } finally {
      setDeletingId(null);
    }
  };

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
              ? getReportCardTitle(row)
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
                        {reportView.reportBody ? (
                          <div className={styles.kv}>
                            <span className={styles.k}>신고 내용</span>
                            <p className={styles.reportBody}>{reportView.reportBody}</p>
                          </div>
                        ) : null}
                        <div className={styles.authorActionRow}>
                          {reportView.authorName ? (
                            <span className={styles.authorNick} title={reportView.authorLabel}>
                              {reportView.authorName}
                            </span>
                          ) : null}
                          {reportView.linkPostId != null ? (
                            <Link
                              className={styles.gotoBtn}
                              to={`/community/posts/${reportView.linkPostId}${
                                reportView.linkHash ? `#${reportView.linkHash}` : ''
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              원본 보기
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ) : row.content ? (
                      <p className={styles.body}>{row.content}</p>
                    ) : null}
                    {row.answerContent ||
                    row.answerAdminNickname ||
                    row.answerHandlingMethod ? (
                      <div className={styles.adminAnswer}>
                        <div className={styles.adminAnswerHeading}>관리자 처리</div>
                        {row.answerAdminNickname ? (
                          <div className={styles.kv}>
                            <span className={styles.k}>처리 관리자</span>
                            <span className={styles.v}>{row.answerAdminNickname}</span>
                          </div>
                        ) : null}
                        {row.answerContent ? (
                          <div className={styles.kv}>
                            <span className={styles.k}>답변</span>
                            <p className={styles.reportBody}>{row.answerContent}</p>
                          </div>
                        ) : null}
                        {row.answerHandlingMethod ? (
                          <div className={styles.kv}>
                            <span className={styles.k}>처리 방법</span>
                            <span className={styles.v}>{row.answerHandlingMethod}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className={styles.detailActions}>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        disabled={deletingId === row.supportId}
                        onClick={(e) => handleDelete(e, row.supportId)}
                      >
                        {deletingId === row.supportId ? '삭제 중…' : '삭제'}
                      </button>
                    </div>
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
