import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { communityAPI } from '../../utils/api';
import {
  COMMUNITY_DEFAULT_AVATAR,
  resolveCommunityAvatarUrl,
} from 'components/12_Community/communityProfileDisplay';
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
  const plain = String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
  const t = plain;
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** 게시글 목록 상단 칩에서 숨김: 공지(notification=0), 인기봇 랭킹 전용 카테고리 */
function hideCategoryFromPostListChips(c) {
  const notif = c?.notification;
  if (notif === 0 || notif === '0') return true;
  const raw = String(c?.name || '').trim();
  if (!raw) return false;
  const compact = raw.replace(/\s+/g, '');
  if (/인기봇\s*랭킹|인기봇랭킹/i.test(raw)) return true;
  if (compact.includes('인기봇') && compact.includes('랭킹')) return true;
  return false;
}

function CommunityPostList() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const canWrite = isAuthenticated;
  const myId = useMemo(() => {
    if (!user) return null;
    return user.userId ?? user.id ?? user.user_id ?? null;
  }, [user]);
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
  const [worrySpotlight, setWorrySpotlight] = useState(null);
  const limit = 20;

  const chipCategories = useMemo(
    () => (Array.isArray(categories) ? categories.filter((c) => !hideCategoryFromPostListChips(c)) : []),
    [categories]
  );

  useEffect(() => {
    if (categoryId === '') return;
    const ok = chipCategories.some((c) => String(c.categoryId) === categoryId);
    if (!ok) setCategoryId('');
  }, [chipCategories, categoryId]);

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
      try {
        const res = await communityAPI.getWorryFeatured();
        if (!cancelled) setWorrySpotlight(res?.spotlight ?? null);
      } catch {
        if (!cancelled) setWorrySpotlight(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (myId != null && Number(p.userId) === Number(myId)) {
      window.alert('본인이 작성한 글에는 좋아요를 누를 수 없어요.');
      return;
    }
    setError('');
    try {
      const res = await communityAPI.togglePostLike(p.postId);
      setPosts((prev) =>
        prev.map((row) =>
          row.postId === p.postId
            ? {
                ...row,
                likedByMe: !!res.liked,
                likeCount: res.likeCount,
                dislikedByMe: !!res.disliked,
                dislikeCount: res.dislikeCount,
              }
            : row
        )
      );
    } catch (e) {
      setError(e?.message || '좋아요 처리에 실패했어요.');
    }
  };

  const handlePostCardDislike = async (event, p) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/community/posts/${p.postId}` } });
      return;
    }
    if (myId != null && Number(p.userId) === Number(myId)) {
      window.alert('본인이 작성한 글에는 싫어요를 누를 수 없어요.');
      return;
    }
    setError('');
    try {
      const res = await communityAPI.togglePostDislike(p.postId);
      setPosts((prev) =>
        prev.map((row) =>
          row.postId === p.postId
            ? {
                ...row,
                likedByMe: !!res.liked,
                likeCount: res.likeCount,
                dislikedByMe: !!res.disliked,
                dislikeCount: res.dislikeCount,
              }
            : row
        )
      );
    } catch (e) {
      setError(e?.message || '싫어요 처리에 실패했어요.');
    }
  };

  const handleRandomWorry = async () => {
    setError('');
    try {
      const res = await communityAPI.drawRandomWorryPost();
      const post = res?.post;
      const pid = post?.postId ?? post?.post_id;
      if (pid != null) {
        navigate(`/community/posts/${pid}`);
        return;
      }
      window.alert(res?.message || '추첨할 글이 없어요.');
    } catch (e) {
      setError(e?.message || '추첨에 실패했어요.');
    }
  };

  const handleRandomStory = async () => {
    setError('');
    try {
      const res = await communityAPI.drawRandomStoryPost();
      const post = res?.post;
      const pid = post?.postId ?? post?.post_id;
      if (pid != null) {
        navigate(`/community/posts/${pid}`);
        return;
      }
      window.alert(res?.message || '추첨할 글이 없어요.');
    } catch (e) {
      setError(e?.message || '추첨에 실패했어요.');
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
    <div className={styles.pageBg}>
      <div className={styles.pageHead}>
        <div className={styles.pageHeadMain}>
          <h1 className={styles.pageTitle}>커뮤니티</h1>
          <p className={styles.pageSubtitle}>
            메이티와 함께한 이야기를 나눠요. 카테고리와 검색으로 글을 모아 볼 수 있어요.
          </p>
        </div>
        {canWrite ? (
          <Link to="/community/write" className={styles.writeBtn}>
            글쓰기
          </Link>
        ) : (
          <Link to="/login" state={{ from: '/community/write' }} className={styles.writeBtn}>
            글쓰기
          </Link>
        )}
      </div>

      {worrySpotlight?.post &&
      (worrySpotlight.post.postId != null || worrySpotlight.post.post_id != null) &&
      String(worrySpotlight.answerContent || '').trim() ? (
        <section className={styles.worrySpotlight} aria-labelledby="matey-worry-spotlight-title">
          <div className={styles.worrySpotlightGlow} aria-hidden />
          <div className={styles.worrySpotlightInner}>
            <div className={styles.worrySpotlightTop}>
              <span className={styles.worrySpotlightBadge}>고민 PICK</span>
              <span className={styles.worrySpotlightMeta}>
                {formatDateTime(worrySpotlight.updatedAt)} · 운영 스토리
              </span>
            </div>
            <h2 id="matey-worry-spotlight-title" className={styles.worrySpotlightTitle}>
              {worrySpotlight.post.title}
            </h2>
            <p className={styles.worrySpotlightExcerpt}>
              {excerpt(worrySpotlight.post.content, 260)}
            </p>
            <div className={styles.worrySpotlightAnswer}>
              <div className={styles.worrySpotlightAnswerHead}>
                <span className={styles.worrySpotlightAnswerKicker}>메이티 운영 답변</span>
                {worrySpotlight.answeredByNickname ? (
                  <span className={styles.worrySpotlightAnswerAuthor}>
                    {worrySpotlight.answeredByNickname}
                  </span>
                ) : null}
              </div>
              <div className={styles.worrySpotlightAnswerBody}>
                {String(worrySpotlight.answerContent || '').trim()}
              </div>
            </div>
            <Link
              className={styles.worrySpotlightCta}
              to={`/community/posts/${worrySpotlight.post.postId ?? worrySpotlight.post.post_id}`}
            >
              원글 전체 보기
            </Link>
          </div>
        </section>
      ) : null}

      <div className={styles.randomPickRow} aria-label="랜덤 글 보기">
        <button type="button" className={styles.randomPickBtn} onClick={handleRandomStory}>
          사연 랜덤 추첨
        </button>
        <button type="button" className={styles.randomPickBtn} onClick={handleRandomWorry}>
          고민 글 랜덤 추첨
        </button>
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
        {chipCategories.map((c) => {
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
            posts.map((p) => {
              const hideEngagement =
                p.categoryNotification === 0 || p.categoryNotification === '0';
              return (
                <div key={p.postId} className={styles.postCard}>
                  <Link to={`/community/posts/${p.postId}`} className={styles.postCardLink}>
                    <div className={styles.postCardLinkInner}>
                      <img
                        src={resolveCommunityAvatarUrl(p.userProfileImage)}
                        alt=""
                        className={styles.postListAvatar}
                        onError={(e) => {
                          e.currentTarget.src = COMMUNITY_DEFAULT_AVATAR;
                        }}
                      />
                      <div className={styles.postCardTextCol}>
                        <div className={styles.postMeta}>
                          <span>{p.categoryName || '카테고리'}</span>
                          <span>
                            {formatDateTime(p.createdAt)} · {p.userNickname || '익명'}
                          </span>
                          <span>조회 {p.viewCount ?? 0}</span>
                        </div>
                        <h2 className={styles.postTitle}>{p.title}</h2>
                        <p className={styles.postExcerpt}>{excerpt(p.content)}</p>
                      </div>
                    </div>
                  </Link>
                  {!hideEngagement ? (
                    <div className={styles.postCardFooter}>
                      <div className={styles.reactionCluster}>
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
                        <button
                          type="button"
                          className={`${styles.dislikeBtn} ${styles.dislikeBtnSm} ${
                            p.dislikedByMe ? styles.dislikeBtnActive : ''
                          }`}
                          onClick={(e) => handlePostCardDislike(e, p)}
                          aria-pressed={!!p.dislikedByMe}
                        >
                          <span className={styles.dislikeIcon} aria-hidden>
                            👎
                          </span>
                          <span>싫어요 {p.dislikeCount ?? 0}</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
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
