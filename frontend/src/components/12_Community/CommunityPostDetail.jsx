import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../../contexts/AuthContext';
import { communityAPI, supportUserAPI } from '../../utils/api';
import CommunityReportModal from './CommunityReportModal';
import styles from './CommunityPage.module.css';

function formatDateTime(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    return value.replace('T', ' ').slice(0, 19);
  }
  if (Array.isArray(value)) {
    const [y, m, d, hh = 0, mm = 0, ss = 0] = value;
    return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
  return String(value);
}

function resolveUserId(user) {
  if (!user) return null;
  return user.userId ?? user.id ?? user.user_id ?? null;
}

/** 고민 카테고리는 '답변', 일상 등 그 외는 '댓글' UI */
function getInteractionLabels(categoryName) {
  const n = (categoryName || '').trim();
  if (n === '고민') {
    return {
      deletePostConfirm: '이 글을 삭제할까요?',
      sectionWithCount: (count) => `답변 (${count})`,
      emptyHint: '아직 답변이 없어요. 먼저 공감과 경험을 나눠 주세요.',
      composeTitle: '답변 남기기',
      loginHint: '로그인 후 답변을 남길 수 있어요.',
      placeholder: '공감과 경험을 바탕으로 조심스럽게 답변해 주세요.',
      submitIdle: '답변 등록',
      deleteConfirm: '이 답변을 삭제할까요?',
      submitFail: '답변 등록에 실패했어요.',
      deleteFail: '답변 삭제에 실패했어요.',
    };
  }
  return {
    deletePostConfirm: '이 글을 삭제할까요?',
    sectionWithCount: (count) => `댓글 (${count})`,
    emptyHint: '아직 댓글이 없어요. 먼저 공감과 경험을 나눠 주세요.',
    composeTitle: '댓글 남기기',
    loginHint: '로그인 후 댓글을 남길 수 있어요.',
    placeholder: '공감과 경험을 바탕으로 조심스럽게 댓글을 남겨 주세요.',
    submitIdle: '댓글 등록',
    deleteConfirm: '이 댓글을 삭제할까요?',
    submitFail: '댓글 등록에 실패했어요.',
    deleteFail: '댓글 삭제에 실패했어요.',
  };
}

function CommunityPostDetail() {
  const { postId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const myId = useMemo(() => resolveUserId(user), [user]);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState('POST');
  const [reportComment, setReportComment] = useState(null);
  const [postLikeBusy, setPostLikeBusy] = useState(false);
  const [postDislikeBusy, setPostDislikeBusy] = useState(false);
  const [commentLikeBusyId, setCommentLikeBusyId] = useState(null);
  const [reportedPost, setReportedPost] = useState(false);
  const [reportedComments, setReportedComments] = useState({});
  const [reportNoticeOpen, setReportNoticeOpen] = useState(false);
  const [reportNoticeMessage, setReportNoticeMessage] = useState('');
  const reportNoticeTitleId = useId();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await communityAPI.getPostDetail(postId);
      setPost(data?.post || null);
      setComments(Array.isArray(data?.comments) ? data.comments : []);
    } catch (e) {
      setError(e?.message || '글을 불러오지 못했어요.');
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!post) return undefined;
    if (!isAuthenticated || myId == null) {
      setReportedPost(false);
      setReportedComments({});
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const pr = await supportUserAPI.reportExists('POST', Number(postId));
        if (cancelled) return;
        setReportedPost(!!pr?.exists);
        const map = {};
        await Promise.all(
          comments.map(async (c) => {
            const rr = await supportUserAPI.reportExists('COMMENT', Number(c.commentId));
            map[c.commentId] = !!rr?.exists;
          })
        );
        if (cancelled) return;
        setReportedComments(map);
      } catch {
        if (!cancelled) {
          setReportedPost(false);
          setReportedComments({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post, comments, isAuthenticated, myId, postId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading) return;
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw || !raw.startsWith('matey-comment-')) return;
    const tryScroll = () => {
      const el = document.getElementById(raw);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      return false;
    };
    if (tryScroll()) return undefined;
    const id = window.requestAnimationFrame(() => {
      tryScroll();
    });
    const t = window.setTimeout(() => tryScroll(), 400);
    return () => {
      window.cancelAnimationFrame(id);
      window.clearTimeout(t);
    };
  }, [loading, location.hash, comments]);

  const isAuthor = post && myId != null && Number(post.userId) === Number(myId);

  const interactionLabels = useMemo(
    () => (post ? getInteractionLabels(post.categoryName) : getInteractionLabels('')),
    [post]
  );

  const isNoticeCategoryPost = useMemo(() => {
    if (!post) return false;
    const n = post.categoryNotification;
    return n === 0 || n === '0';
  }, [post]);

  const showAlreadyReportedNotice = (message) => {
    setReportNoticeMessage(message);
    setReportNoticeOpen(true);
  };

  const openPostReport = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/community/posts/${postId}` } });
      return;
    }
    if (reportedPost) {
      showAlreadyReportedNotice('이미 이 게시글을 신고하셨어요. 접수 내역은 마이페이지의 문의·신고함에서 확인할 수 있어요.');
      return;
    }
    setReportComment(null);
    setReportTarget('POST');
    setReportOpen(true);
  };

  const openCommentReport = (comment) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/community/posts/${postId}` } });
      return;
    }
    if (comment && reportedComments[comment.commentId]) {
      showAlreadyReportedNotice('이미 이 댓글을 신고하셨어요. 접수 내역은 마이페이지의 문의·신고함에서 확인할 수 있어요.');
      return;
    }
    setReportComment(comment);
    setReportTarget('COMMENT');
    setReportOpen(true);
  };

  const handleTogglePostLike = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/community/posts/${postId}` } });
      return;
    }
    setPostLikeBusy(true);
    setError('');
    try {
      const res = await communityAPI.togglePostLike(postId);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              likedByMe: !!res.liked,
              likeCount: res.likeCount,
              dislikedByMe: !!res.disliked,
              dislikeCount: res.dislikeCount,
            }
          : prev
      );
    } catch (e) {
      setError(e?.message || '좋아요 처리에 실패했어요.');
    } finally {
      setPostLikeBusy(false);
    }
  };

  const handleTogglePostDislike = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/community/posts/${postId}` } });
      return;
    }
    setPostDislikeBusy(true);
    setError('');
    try {
      const res = await communityAPI.togglePostDislike(postId);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              likedByMe: !!res.liked,
              likeCount: res.likeCount,
              dislikedByMe: !!res.disliked,
              dislikeCount: res.dislikeCount,
            }
          : prev
      );
    } catch (e) {
      setError(e?.message || '싫어요 처리에 실패했어요.');
    } finally {
      setPostDislikeBusy(false);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/community/posts/${postId}` } });
      return;
    }
    setCommentLikeBusyId(commentId);
    setError('');
    try {
      const res = await communityAPI.toggleCommentLike(postId, commentId);
      setComments((prev) =>
        prev.map((c) =>
          Number(c.commentId) === Number(commentId)
            ? { ...c, likedByMe: res.liked, likeCount: res.likeCount }
            : c
        )
      );
    } catch (e) {
      setError(e?.message || '좋아요 처리에 실패했어요.');
    } finally {
      setCommentLikeBusyId(null);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/community/posts/${postId}` } });
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    setSubmitting(true);
    setError('');
    try {
      await communityAPI.createComment(postId, { content: text, parentCommentId: null });
      setCommentText('');
      await load();
    } catch (e) {
      setError(e?.message || interactionLabels.submitFail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm(interactionLabels.deletePostConfirm)) return;
    setError('');
    try {
      await communityAPI.deletePost(postId);
      navigate('/community');
    } catch (e) {
      setError(e?.message || '삭제에 실패했어요.');
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm(interactionLabels.deleteConfirm)) return;
    setError('');
    try {
      await communityAPI.deleteComment(postId, comment.commentId);
      await load();
    } catch (e) {
      setError(e?.message || interactionLabels.deleteFail);
    }
  };

  if (loading) {
    return <p className={styles.hint}>불러오는 중이에요…</p>;
  }

  if (!post) {
    return (
      <div>
        <p className={styles.errorText}>{error || '게시글을 찾을 수 없어요.'}</p>
        <Link to="/community" className={styles.ghostBtn}>
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div>
      <CommunityReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        target={reportTarget}
        postId={postId}
        postTitle={post?.title}
        postAuthorNickname={post?.userNickname}
        comment={reportComment}
        onSubmitted={() => {
          if (reportTarget === 'POST') setReportedPost(true);
          else if (reportComment)
            setReportedComments((prev) => ({ ...prev, [reportComment.commentId]: true }));
        }}
      />

      {reportNoticeOpen ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setReportNoticeOpen(false);
          }}
        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby={reportNoticeTitleId}
          >
            <h2 id={reportNoticeTitleId} className={styles.modalTitle}>
              알림
            </h2>
            <p className={styles.hint} style={{ marginBottom: 18 }}>
              {reportNoticeMessage}
            </p>
            <div className={styles.composeSubmitRow}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setReportNoticeOpen(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.subPageBar}>
        <Link to="/community" className={styles.backLink}>
          ← 커뮤니티
        </Link>
      </div>

      {isAuthor ? (
        <div className={styles.detailAuthorActions}>
          <Link to={`/community/posts/${postId}/edit`} className={styles.primaryBtn}>
            수정
          </Link>
          <button type="button" className={styles.ghostBtn} onClick={handleDeletePost}>
            삭제
          </button>
        </div>
      ) : null}

      {error ? <p className={styles.errorText}>{error}</p> : null}

      <header className={styles.detailArticleHead}>
        <div className={styles.detailCategory}>{post.categoryName || '카테고리'}</div>
        <h1 className={styles.detailTitle}>{post.title}</h1>
        <div className={styles.detailByline}>
          <strong className={styles.detailNickname}>{post.userNickname || '익명'}</strong>
          <span className={styles.detailMetaSep} aria-hidden>
            {' '}
          </span>
          <span className={styles.detailMetaPieces}>
            {formatDateTime(post.createdAt)} · 조회 {post.viewCount ?? 0}
          </span>
        </div>
      </header>
      <div
        className={styles.detailBody}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(String(post.content || ''), {
            ALLOWED_TAGS: [
              'p',
              'br',
              'strong',
              'em',
              'u',
              's',
              'span',
              'a',
              'h1',
              'h2',
              'h3',
              'ol',
              'ul',
              'li',
              'blockquote',
            ],
            ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
          }),
        }}
      />

      {!isNoticeCategoryPost ? (
        <div className={styles.permalinkToolbar}>
          <div className={styles.permalinkToolbarInner}>
            <div className={styles.reactionCluster}>
              <button
                type="button"
                className={`${styles.likeBtn} ${post.likedByMe ? styles.likeBtnActive : ''}`}
                onClick={handleTogglePostLike}
                disabled={isAuthor || postLikeBusy || postDislikeBusy}
                title={isAuthor ? '본인이 작성한 글에는 좋아요를 누를 수 없어요.' : undefined}
                aria-pressed={!!post.likedByMe}
              >
                <span className={styles.likeIcon} aria-hidden>
                  ♥
                </span>
                <span>좋아요 {post.likeCount ?? 0}</span>
              </button>
              <button
                type="button"
                className={`${styles.dislikeBtn} ${post.dislikedByMe ? styles.dislikeBtnActive : ''}`}
                onClick={handleTogglePostDislike}
                disabled={isAuthor || postLikeBusy || postDislikeBusy}
                title={isAuthor ? '본인이 작성한 글에는 싫어요를 누를 수 없어요.' : undefined}
                aria-pressed={!!post.dislikedByMe}
              >
                <span className={styles.dislikeIcon} aria-hidden>
                  👎
                </span>
                <span>싫어요 {post.dislikeCount ?? 0}</span>
              </button>
            </div>
            {!isAuthor ? (
              <button type="button" className={styles.inlineReportBtn} onClick={openPostReport}>
                신고
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <h2 className={styles.sectionTitle}>{interactionLabels.sectionWithCount(comments.length)}</h2>
      {comments.length === 0 ? (
        <p className={styles.hint}>{interactionLabels.emptyHint}</p>
      ) : (
        comments.map((c) => {
          const mine = myId != null && Number(c.userId) === Number(myId);
          return (
            <article
              key={c.commentId}
              id={`matey-comment-${c.commentId}`}
              className={styles.commentBox}
            >
              <div className={styles.commentHeaderRow}>
                <div className={styles.commentByline}>
                  <strong className={styles.commentNick}>{c.userNickname || '익명'}</strong>
                  <span className={styles.commentDate}>
                    {' '}
                    · {formatDateTime(c.createdAt)}
                  </span>
                </div>
                {mine ? (
                  <button
                    type="button"
                    className={styles.commentDeleteBtn}
                    onClick={() => handleDeleteComment(c)}
                  >
                    삭제
                  </button>
                ) : null}
              </div>
              <p className={styles.commentText}>{c.content}</p>
              {!isNoticeCategoryPost ? (
                <div className={styles.commentFooterBar}>
                  <div className={styles.commentFooterInner}>
                    <button
                      type="button"
                      className={`${styles.likeBtn} ${styles.likeBtnSm} ${
                        c.likedByMe ? styles.likeBtnActive : ''
                      }`}
                      onClick={() => handleToggleCommentLike(c.commentId)}
                      disabled={mine || commentLikeBusyId === c.commentId}
                      title={mine ? '본인이 작성한 댓글에는 좋아요를 누를 수 없어요.' : undefined}
                      aria-pressed={!!c.likedByMe}
                    >
                      <span className={styles.likeIcon} aria-hidden>
                        ♥
                      </span>
                      <span>좋아요 {c.likeCount ?? 0}</span>
                    </button>
                    {!mine ? (
                      <button
                        type="button"
                        className={styles.inlineReportBtn}
                        onClick={() => openCommentReport(c)}
                      >
                        신고
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })
      )}

      <h2 className={styles.sectionTitle}>{interactionLabels.composeTitle}</h2>
      {!isAuthenticated ? (
        <p className={styles.hint}>
          {interactionLabels.loginHint}{' '}
          <Link to="/login" state={{ from: `/community/posts/${postId}` }}>
            로그인하기
          </Link>
        </p>
      ) : (
        <form onSubmit={handleCommentSubmit}>
          <textarea
            className={styles.textarea}
            placeholder={interactionLabels.placeholder}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <div className={styles.composeSubmitRow}>
            <button type="submit" className={styles.primaryBtn} disabled={submitting}>
              {submitting ? '등록 중…' : interactionLabels.submitIdle}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CommunityPostDetail;
