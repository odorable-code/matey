import React, { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supportPublicAPI, supportUserAPI } from '../../utils/api';
import { filterInquiryReasons } from './communitySupportReasons';
import styles from './CommunityPage.module.css';

/**
 * 일반 문의 폼 (게시글/댓글 신고와 분리)
 * @param {boolean} showIntro — FAQ 하단에 붙일 때 제목·안내 문구 표시
 * @param {string} loginReturnTo — 로그인 후 돌아올 경로
 */
function CommunityInquirySection({
  showIntro = true,
  loginReturnTo = '/community/faq',
}) {
  const id = useId();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading } = useAuth();
  const [reasons, setReasons] = useState([]);
  const [supportReasonId, setSupportReasonId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitDoneOpen, setSubmitDoneOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await supportPublicAPI.getReasons();
        const list = res?.reasons ?? [];
        setReasons(filterInquiryReasons(Array.isArray(list) ? list : []));
      } catch (e) {
        if (!cancelled) setError(e?.message || '분류 목록을 불러오지 못했어요.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) return;
    setError('');
    if (!supportReasonId) {
      setError('문의 유형을 선택해 주세요.');
      return;
    }
    const t = title.trim();
    const b = content.trim();
    if (!t || !b) {
      setError('제목과 내용을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      await supportUserAPI.createTicket({
        title: t,
        content: b,
        supportReasonId: Number(supportReasonId),
      });
      setTitle('');
      setContent('');
      setSupportReasonId('');
      setSubmitDoneOpen(true);
    } catch (e) {
      setError(e?.message || '접수에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {submitDoneOpen ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSubmitDoneOpen(false);
              navigate('/mypage?section=support');
            }
          }}        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-inq-done-title`}
          >
            <h2 id={`${id}-inq-done-title`} className={styles.modalTitle}>
              접수 완료
            </h2>
            <p className={styles.hint} style={{ marginBottom: 18 }}>
              문의가 접수되었어요. 답변은 마이페이지의 문의·신고함에서 확인할 수 있어요.
            </p>
            <div className={styles.composeSubmitRow}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => {
                  setSubmitDoneOpen(false);
                  navigate('/mypage?section=support');
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section
        className={showIntro ? styles.faqInquirySection : styles.inquiryFormBlock}
        aria-labelledby={showIntro ? `${id}-inq-heading` : undefined}
      >
      {showIntro ? (
        <>
          <h2 id={`${id}-inq-heading`} className={styles.sectionTitle}>
            문의하기
          </h2>
          <p className={styles.hint} style={{ marginBottom: 16 }}>
            서비스 이용·계정·오류 등 문의를 남기면 관리자가 확인 후 답변해요. 접수 내역과 답변은{' '}
            <strong>마이페이지 → 문의 내역</strong>에서 확인할 수 있어요.
          </p>
        </>
      ) : null}

      {authLoading ? (
        <p className={styles.hint}>로그인 상태를 확인하고 있어요…</p>
      ) : !isAuthenticated ? (
        <p className={styles.hint}>
          문의를 남기려면 로그인이 필요해요.{' '}
          <Link to="/login" state={{ from: loginReturnTo }}>
            로그인하기
          </Link>
        </p>
      ) : null}

      {isAuthenticated ? (
        <>
          {loading ? <p className={styles.hint}>불러오는 중…</p> : null}
          {error ? <p className={styles.errorText}>{error}</p> : null}

          <form onSubmit={handleSubmit}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor={`${id}-reason`}>
                유형
              </label>
              <select
                id={`${id}-reason`}
                className={styles.select}
                style={{ width: '100%', maxWidth: 400 }}
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
              <label className={styles.fieldLabel} htmlFor={`${id}-title`}>
                제목
              </label>
              <input
                id={`${id}-title`}
                className={styles.input}
                style={{ width: '100%', display: 'block' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor={`${id}-body`}>
                내용
              </label>
              <textarea
                id={`${id}-body`}
                className={styles.textarea}
                style={{ minHeight: 160 }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="상황을 구체적으로 적어 주시면 답변이 빨라져요."
              />
            </div>
            <div className={styles.rowActions}>
              <button type="submit" className={styles.primaryBtn} disabled={saving || loading}>
                {saving ? '접수 중…' : '접수하기'}
              </button>
            </div>
          </form>
        </>
      ) : null}
    </section>
    </>
  );
}

export default CommunityInquirySection;
