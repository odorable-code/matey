import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './FaqPage.module.css';
import { supportPublicAPI, adminAPI } from 'utils/api';
import { useAuth } from '../contexts/AuthContext';
import { isCommunityStaffPublisher } from 'utils/communityWriteAccess';

function normalizeFaqList(res) {
  const list = res?.faq ?? res?.items ?? res;
  return Array.isArray(list) ? list : [];
}

function FaqEditorModal({ open, initial, onClose, onSubmit, saving }) {
  const [question, setQuestion] = useState(initial?.question || '');
  const [answer, setAnswer] = useState(initial?.answer || '');
  const isEdit = Boolean(initial?.faqId);

  useEffect(() => {
    if (!open) return;
    setQuestion(initial?.question || '');
    setAnswer(initial?.answer || '');
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <div>
            <p className={styles.modalEyebrow}>ADMIN</p>
            <h2 className={styles.modalTitle}>{isEdit ? 'FAQ 수정' : 'FAQ 작성'}</h2>
          </div>
          <button type="button" onClick={onClose} className={styles.modalClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.fieldLabel} htmlFor="faq-q">
            질문
          </label>
          <input
            id="faq-q"
            className={styles.input}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="예) 비밀번호를 잊어버렸어요."
            maxLength={200}
          />

          <label className={styles.fieldLabel} htmlFor="faq-a" style={{ marginTop: 14 }}>
            답변
          </label>
          <textarea
            id="faq-a"
            className={styles.textarea}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="답변 내용을 입력해 주세요."
            rows={7}
          />
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.ghostBtn} onClick={onClose} disabled={saving}>
            취소
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => onSubmit({ question: question.trim(), answer: answer.trim() })}
            disabled={saving || !question.trim() || !answer.trim()}
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const { user, authLoading } = useAuth();
  const canEditFaq = useMemo(() => isCommunityStaffPublisher(user), [user]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInitial, setEditorInitial] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await supportPublicAPI.getFaqList();
      setItems(normalizeFaqList(res));
    } catch (e) {
      setError(e?.message || 'FAQ를 불러오지 못했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenCreate = () => {
    setEditorInitial(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (faq) => {
    setEditorInitial(faq);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditorInitial(null);
  };

  const handleSubmit = async ({ question, answer }) => {
    if (!canEditFaq) return;
    setSaving(true);
    try {
      if (editorInitial?.faqId) {
        await adminAPI.updateFaq(editorInitial.faqId, { question, answer });
      } else {
        await adminAPI.createFaq({ question, answer });
      }
      setEditorOpen(false);
      setEditorInitial(null);
      await load();
    } catch (e) {
      window.alert(e?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>FAQ</p>
            <h1 className={styles.title}>자주 묻는 질문</h1>
            <p className={styles.subtitle}>
              메이티 이용 중 자주 나오는 질문을 모아두었습니다. 찾는 답이 없으면 문의로 남겨 주세요.
            </p>

            {canEditFaq && !authLoading ? (
              <div className={styles.heroAdminActions}>
                <button type="button" className={styles.primaryBtn} onClick={handleOpenCreate}>
                  FAQ 작성
                </button>
              </div>
            ) : null}
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.heroBlob} />
            <div className={styles.heroMascots}>
              <img className={styles.mascot} src="/images/mascots/dog/dog.png" alt="" />
            </div>

            <svg className={styles.heroLines} viewBox="0 0 520 260" fill="none">
              <path
                d="M26 192C120 112 156 214 248 156C340 96 372 186 498 76"
                stroke="rgba(141,121,255,0.28)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M18 214C110 142 176 238 268 176C360 114 404 214 508 102"
                stroke="rgba(121,183,255,0.22)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="498" cy="76" r="10" fill="rgba(255,147,183,0.42)" />
              <circle cx="248" cy="156" r="9" fill="rgba(121,183,255,0.42)" />
              <circle cx="26" cy="192" r="9" fill="rgba(141,121,255,0.42)" />
            </svg>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        {error ? <p className={styles.errorText}>{error}</p> : null}
        {loading ? (
          <p className={styles.hint}>불러오는 중입니다…</p>
        ) : items.length === 0 ? (
          <p className={styles.hint}>등록된 FAQ가 아직 없습니다.</p>
        ) : (
          <div className={styles.faqList}>
            {items.map((item) => (
              <details key={item.faqId || item.question} className={styles.faqItem}>
                <summary className={styles.faqSummary}>
                  <span className={styles.faqQ}>Q.</span>
                  <span className={styles.faqQuestion}>{item.question}</span>
                  {canEditFaq ? (
                    <button
                      type="button"
                      className={styles.editBtn}
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenEdit(item);
                      }}
                    >
                      수정
                    </button>
                  ) : null}
                </summary>
                <div className={styles.faqBody}>
                  <span className={styles.faqA}>A.</span>
                  <div className={styles.faqAnswer}>{item.answer}</div>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <FaqEditorModal
        open={editorOpen}
        initial={editorInitial}
        onClose={handleCloseEditor}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </main>
  );
}

