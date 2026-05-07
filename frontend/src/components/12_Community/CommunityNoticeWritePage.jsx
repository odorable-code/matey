import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../utils/api';
import { isAdminNoticePublisher } from '../../utils/communityWriteAccess';
import styles from './CommunityPage.module.css';

export default function CommunityNoticeWritePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/community/notices/write' } });
      return;
    }
    if (!isAdminNoticePublisher(user)) {
      navigate('/community/notices', { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) {
      setError('제목과 내용을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      await adminAPI.createNotice({
        title: t,
        content: c,
        isPublished: true,
      });
      navigate('/community/notices');
    } catch (err) {
      setError(err?.message || '공지 등록에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthenticated || !isAdminNoticePublisher(user)) {
    return <p className={styles.hint}>확인 중…</p>;
  }

  return (
    <div>
      <div className={styles.subPageBar}>
        <Link to="/community/notices" className={styles.backLink}>
          ← 공지 목록
        </Link>
      </div>
      <h1 className={styles.pageTitle}>공지 작성</h1>
      <p className={styles.pageSubtitle} style={{ marginBottom: 20 }}>
        등록 즉시 공지 목록에 게시됩니다.
      </p>
      {error ? <p className={styles.errorText}>{error}</p> : null}
      <form onSubmit={handleSubmit}>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="notice-title">
            제목
          </label>
          <input
            id="notice-title"
            className={styles.input}
            style={{ width: '100%', display: 'block' }}
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            maxLength={200}
          />
        </div>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="notice-body">
            내용
          </label>
          <textarea
            id="notice-body"
            className={styles.textarea}
            style={{ minHeight: 220 }}
            value={content}
            onChange={(ev) => setContent(ev.target.value)}
          />
        </div>
        <div className={styles.rowActions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? '등록 중…' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
