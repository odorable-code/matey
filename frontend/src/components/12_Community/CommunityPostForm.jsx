import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { communityAPI } from '../../utils/api';
import styles from './CommunityPage.module.css';

function resolveUserId(user) {
  if (!user) return null;
  return user.userId ?? user.id ?? user.user_id ?? null;
}

function CommunityPostForm() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, authLoading } = useAuth();
  const isEdit = Boolean(postId);

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const myId = useMemo(() => resolveUserId(user), [user]);

  const loadCategories = useCallback(async () => {
    const list = await communityAPI.getCategories();
    setCategories(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: isEdit ? `/community/posts/${postId}/edit` : '/community/write' } });
    }
  }, [authLoading, isAuthenticated, isEdit, navigate, postId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadCategories();
        if (!isEdit || cancelled) return;
        setLoading(true);
        const data = await communityAPI.getPostDetail(postId);
        const p = data?.post;
        if (!p) {
          setError('글을 찾을 수 없어요.');
          return;
        }
        if (myId != null && Number(p.userId) !== Number(myId)) {
          setError('본인이 작성한 글만 수정할 수 있어요.');
          return;
        }
        setTitle(p.title || '');
        setContent(p.content || '');
        setCategoryId(p.categoryId != null ? String(p.categoryId) : '');
      } catch (e) {
        if (!cancelled) setError(e?.message || '불러오지 못했어요.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, loadCategories, myId, postId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) return;
    setError('');
    const tid = title.trim();
    const body = content.trim();
    if (!tid || !body) {
      setError('제목과 내용을 모두 입력해 주세요.');
      return;
    }
    if (!categoryId) {
      setError('카테고리를 선택해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: tid,
        content: body,
        categoryId: Number(categoryId),
      };
      if (isEdit) {
        await communityAPI.updatePost(postId, payload);
        navigate(`/community/posts/${postId}`);
      } else {
        const res = await communityAPI.createPost(payload);
        const newId = res?.postId;
        if (newId) {
          navigate(`/community/posts/${newId}`);
        } else {
          navigate('/community');
        }
      }
    } catch (e) {
      setError(e?.message || '저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <p className={styles.hint}>로그인 확인 중…</p>;
  }

  if (loading) {
    return <p className={styles.hint}>불러오는 중이에요…</p>;
  }

  return (
    <div>
      <div className={styles.subPageBar}>
        <Link to="/community" className={styles.backLink}>
          ← 커뮤니티
        </Link>
      </div>
      <div className={styles.rowActions} style={{ marginBottom: 16 }}>
        <Link to={isEdit ? `/community/posts/${postId}` : '/community'} className={styles.ghostBtn}>
          취소
        </Link>
      </div>
      <h1 className={styles.pageTitle}>{isEdit ? '고민글 수정' : '고민글 작성'}</h1>
      <p className={styles.pageSubtitle} style={{ marginBottom: 20 }}>
        다른 사용자를 존중하는 마음으로 작성해 주세요. 욕설·개인정보 노출·불법 내용은 제재될 수 있어요.
      </p>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      <form onSubmit={handleSubmit}>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="comm-cat">
            카테고리
          </label>
          <select
            id="comm-cat"
            className={styles.select}
            style={{ width: '100%', maxWidth: 360 }}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">선택</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="comm-title">
            제목
          </label>
          <input
            id="comm-title"
            className={styles.input}
            style={{ width: '100%', display: 'block' }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="comm-body">
            내용
          </label>
          <textarea
            id="comm-body"
            className={styles.textarea}
            style={{ minHeight: 220 }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className={styles.rowActions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? '저장 중…' : isEdit ? '수정 완료' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommunityPostForm;
