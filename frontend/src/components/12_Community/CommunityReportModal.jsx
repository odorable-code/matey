import React, { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supportPublicAPI, supportUserAPI } from '../../utils/api';
import { filterReportReasons } from './communitySupportReasons';
import styles from './CommunityPage.module.css';

function excerpt(text, max = 80) {
  if (!text) return '';
  const t = String(text).replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/**
 * 게시글 또는 댓글 신고 — SUPPORT 테이블 문의 티켓으로 접수 (관리자 답변은 마이페이지 동일)
 */
function CommunityReportModal({
  open,
  onClose,
  target,
  postId,
  postTitle,
  postAuthorNickname,
  comment,
  onSubmitted,
}) {
  const uid = useId();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [reasons, setReasons] = useState([]);
  const [supportReasonId, setSupportReasonId] = useState('');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      setSupportReasonId('');
      setTitle('');
      setDetail('');
      try {
        const res = await supportPublicAPI.getReasons();
        const list = res?.reasons ?? [];
        const want = target === 'COMMENT' ? 'COMMENT' : 'POST';
        setReasons(filterReportReasons(Array.isArray(list) ? list : [], want));
      } catch (e) {
        if (!cancelled) setError(e?.message || '사유 목록을 불러오지 못했어요.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, target]);

  useEffect(() => {
    if (!open) setSubmitDone(false);
  }, [open]);

  if (!open) return null;

  if (submitDone) {
    return (
      <div
        className={styles.modalBackdrop}
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            onSubmitted?.();
            onClose();
          }
        }}
      >
        <div
          className={styles.modalCard}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${uid}-report-done-title`}
        >
          <h2 id={`${uid}-report-done-title`} className={styles.modalTitle}>
            접수 완료
          </h2>
          <p className={styles.hint} style={{ marginBottom: 18 }}>
            신고가 접수되었어요. 처리 결과는 마이페이지의 문의·신고함에서 확인할 수 있어요.
          </p>
          <div className={styles.composeSubmitRow}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                onSubmitted?.();
                onClose();
              }}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/community/posts/${postId}` } });
      return;
    }
    if (!supportReasonId) {
      setError('신고 사유를 선택해 주세요.');
      return;
    }
    const t = title.trim();
    if (!t) {
      setError('신고 제목을 입력해 주세요.');
      return;
    }
    const body = detail.trim();
    if (!body) {
      setError('신고 내용을 입력해 주세요.');
      return;
    }

    const rid = Number(supportReasonId);

    const metaLines =
      target === 'COMMENT' && comment
        ? [`__MATEY_POST_ID__=${postId}`, `__MATEY_COMMENT_ID__=${comment.commentId}`]
        : [`__MATEY_POST_ID__=${postId}`];

    let ticketTitle;
    let ticketContent;
    if (target === 'COMMENT' && comment) {
      ticketTitle = `[REPORT COMMENT ${comment.commentId}] ${t}`;
      ticketContent = [
        ...metaLines,
        `신고 대상 댓글: ${excerpt(comment.content, 200)}`,
        `작성자: ${comment.userNickname || '익명'}`,
        `대상 글: ${postTitle || ''}`,
        '',
        `신고 내용: ${body}`,
      ].join('\n');
    } else {
      ticketTitle = `[REPORT POST ${postId}] ${t}`;
      ticketContent = [
        ...metaLines,
        `신고 대상 글: ${postTitle || ''}`,
        `작성자: ${postAuthorNickname || '익명'}`,
        '',
        `신고 내용: ${body}`,
      ].join('\n');
    }

    setSaving(true);
    try {
      await supportUserAPI.createTicket({
        title: ticketTitle.slice(0, 200),
        content: ticketContent,
        supportReasonId: rid,
      });
      setSubmitDone(true);
    } catch (e) {
      if (e?.status === 401 || e?.status === 403) {
        setError('로그인 후 신고할 수 있어요.');
      } else if (e?.status === 409) {
        setError(e?.message || '이미 신고한 내용이에요.');
      } else {
        setError(e?.message || '신고 접수에 실패했어요.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-report-title`}
      >
        <h2 id={`${uid}-report-title`} className={styles.modalTitle}>
          {target === 'COMMENT' ? '댓글 신고' : '게시글 신고'}
        </h2>
        <p className={styles.hint} style={{ marginBottom: 14 }}>
          허위 신고는 제재될 수 있어요. 접수 후 처리 결과는 마이페이지의 문의 내역에서 확인할 수 있어요.
        </p>

        {loading ? <p className={styles.hint}>불러오는 중…</p> : null}
        {error ? <p className={styles.errorText}>{error}</p> : null}

        {!loading && reasons.length === 0 ? (
          <p className={styles.hint}>등록된 신고 사유가 없어요. 관리자에게 문의해 주세요.</p>
        ) : null}

        {reasons.length > 0 ? (
          <form onSubmit={handleSubmit}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor={`${uid}-title`}>
                제목
              </label>
              <input
                id={`${uid}-title`}
                className={styles.input}
                style={{ width: '100%', display: 'block' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="신고 제목을 입력해 주세요."
              />
            </div>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor={`${uid}-reason`}>
                신고 사유
              </label>
              <select
                id={`${uid}-reason`}
                className={styles.select}
                style={{ width: '100%' }}
                value={supportReasonId}
                onChange={(e) => setSupportReasonId(e.target.value)}
              >
                <option value="">선택</option>
                {reasons.map((r) => (
                  <option key={r.supportReasonId} value={r.supportReasonId}>
                    {r.reasonName}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor={`${uid}-detail`}>
                신고 내용
              </label>
              <textarea
                id={`${uid}-detail`}
                className={styles.textarea}
                style={{ minHeight: 120 }}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="어떤 점이 문제인지 구체적으로 적어 주세요."
              />
            </div>
            <div className={styles.rowActions}>
              <button type="button" className={styles.ghostBtn} onClick={onClose} disabled={saving}>
                취소
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={saving || loading}>
                {saving ? '접수 중…' : '신고 접수'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default CommunityReportModal;
