import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { communityAPI } from '../../utils/api';
import { canWriteCommunityPosts } from '../../utils/communityWriteAccess';
import styles from './CommunityPage.module.css';

function formatDateTime(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    return value.replace('T', ' ').slice(0, 16);
  }
  if (Array.isArray(value)) {
    const [y, m, d, hh = 0, mm = 0] = value;
    return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
  return String(value);
}

function excerpt(text, max = 120) {
  if (!text) return '';
  const t = String(text).replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function CommunityPostList() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const showWriteBtn = canWriteCommunityPosts(user);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [posts, setPosts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const loadCategories = useCallback(async () => {
    const list = await communityAPI.getCategories();
    setCategories(Array.isArray(list) ? list : []);
  }, []);

  const fetchPage = useCallback(
    async (nextOffset, append) => {
      const params = {
        limit,
        offset: nextOffset,
        keyword: appliedKeyword || undefined,
      };
      if (categoryId !== '') {
        params.categoryId = Number(categoryId);
      }
      const list = await communityAPI.getPosts(params);
      const rows = Array.isArray(list) ? list : [];
      if (append) {
        setPosts((prev) => [...prev, ...rows]);
      } else {
        setPosts(rows);
        setHasMore(rows.length >= limit);
      }
      if (append && rows.length < limit) {
        setHasMore(false);
      }
      return rows.length;
    },
    [appliedKeyword, categoryId]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadCategories();
      } catch {
        /* ignore */
      }
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCategories]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      setOffset(0);
      setHasMore(true);
      try {
        await fetchPage(0, false);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || '요청 처리 중 오류가 발생했어요.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const handleSearch = (event) => {
    event.preventDefault();
    setAppliedKeyword(keywordInput.trim());
  };

  const handlePostCardLike = async (event, p) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/community/posts/${p.postId}` } });
      return;
    }
    setError('');
    try {
      const res = await communityAPI.togglePostLike(p.postId);
      setPosts((prev) =>
        prev.map((row) =>
          row.postId === p.postId ? { ...row, likedByMe: res.liked, likeCount: res.likeCount } : row
        )
      );
    } catch (e) {
      setError(e?.message || '좋아요 처리에 실패했어요.');
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    setError('');
    try {
      const next = offset + limit;
      const n = await fetchPage(next, true);
      if (n > 0) {
        setOffset(next);
      }
      if (n < limit) {
        setHasMore(false);
      }
    } catch (e) {
      setError(e?.message || '요청 처리 중 오류가 발생했어요.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div className={styles.pageHeadMain}>
          <h1 className={styles.pageTitle}>커뮤니티</h1>
          <p className={styles.pageSubtitle}>
            메이티와 함께한 이야기를 나눠요. 카테고리와 검색으로 글을 모아 볼 수 있어요.
          </p>
        </div>
        {showWriteBtn ? (
          <Link to="/community/write" className={styles.writeBtn}>
            새 글 작성
          </Link>
        ) : null}
      </div>

      <form className={styles.searchRow} onSubmit={handleSearch}>
        <div className={styles.searchField}>
          <input
            className={styles.searchInputFull}
            type="search"
            placeholder="제목·내용 검색"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            aria-label="제목·내용 검색"
          />
          <button type="submit" className={styles.searchBtnIn} disabled={loading}>
            검색
          </button>
        </div>
      </form>

      <div className={styles.chipRow} role="tablist" aria-label="카테고리">
        <button
          type="button"
          role="tab"
          aria-selected={categoryId === ''}
          className={`${styles.chip} ${categoryId === '' ? styles.chipActive : ''}`}
          onClick={() => setCategoryId('')}
        >
          전체
        </button>
        {categories.map((c) => {
          const id = String(c.categoryId);
          const active = categoryId === id;
          return (
            <button
              key={c.categoryId}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
              onClick={() => setCategoryId(id)}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      {loading ? (
        <p className={styles.hint}>불러오는 중이에요…</p>
      ) : (
        <div className={styles.postList}>
          {posts.length === 0 ? (
            <p className={styles.hint}>아직 글이 없어요.</p>
          ) : (
            posts.map((p) => (
              <div key={p.postId} className={styles.postCard}>
                <Link to={`/community/posts/${p.postId}`} className={styles.postCardLink}>
                  <div className={styles.postMeta}>
                    <span>{p.categoryName || '카테고리'}</span>
                    <span>{p.userNickname || '익명'}</span>
                    <span>조회 {p.viewCount ?? 0}</span>
                    <span>{formatDateTime(p.createdAt)}</span>
                  </div>
                  <h2 className={styles.postTitle}>{p.title}</h2>
                  <p className={styles.postExcerpt}>{excerpt(p.content)}</p>
                </Link>
                <div className={styles.postCardFooter}>
                  <button
                    type="button"
                    className={`${styles.likeBtn} ${styles.likeBtnSm} ${
                      p.likedByMe ? styles.likeBtnActive : ''
                    }`}
                    onClick={(e) => handlePostCardLike(e, p)}
                    aria-pressed={!!p.likedByMe}
                  >
                    <span className={styles.likeIcon} aria-hidden>
                      ♥
                    </span>
                    <span>좋아요 {p.likeCount ?? 0}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && posts.length > 0 && hasMore ? (
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? '불러오는 중…' : '더 보기'}
          </button>
        </div>
      ) : null}

      <div className={styles.homeFooter}>
        <Link to="/" className={styles.homeLink}>
          ← 홈으로
        </Link>
      </div>
    </div>
  );
}

export default CommunityPostList;
