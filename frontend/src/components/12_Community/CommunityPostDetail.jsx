import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { communityAPI } from '../../utils/api';
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
      deletePostConfirm: '이 고민글을 삭제할까요?',
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
    load();
  }, [load]);

  const isAuthor = post && myId != null && Number(post.userId) === Number(myId);

  const interactionLabels = useMemo(
    () => (post ? getInteractionLabels(post.categoryName) : getInteractionLabels('')),
    [post]
  );

  const openPostReport = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/community/posts/${postId}` } });
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
    setReportComment(comment);
    setReportTarget('COMMENT');
    setReportOpen(true);
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
        comment={reportComment}
        onSubmitted={() => {
          /* no-op: 신고 접수 확인은 마이페이지 문의 내역 */
        }}
      />

      <div className={styles.subPageBar}>
        <Link to="/community" className={styles.backLink}>
          ← 커뮤니티
        </Link>
      </div>
      <div className={styles.rowActions} style={{ marginBottom: 12 }}>
        {isAuthor ? (
          <>
            <Link to={`/community/posts/${postId}/edit`} className={styles.primaryBtn}>
              수정
            </Link>
            <button type="button" className={styles.ghostBtn} onClick={handleDeletePost}>
              삭제
            </button>
          </>
        ) : null}
      </div>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.postMeta} style={{ marginBottom: 8 }}>
        <span>{post.categoryName || '카테고리'}</span>
        <span>{post.userNickname || '익명'}</span>
        <span>조회 {post.viewCount ?? 0}</span>
        <span>{formatDateTime(post.createdAt)}</span>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h1 className={styles.detailTitle} style={{ flex: '1 1 200px', marginBottom: 0 }}>
          {post.title}
        </h1>
        {!isAuthor ? (
          <button type="button" className={styles.reportLinkBtn} onClick={openPostReport}>
            신고
          </button>
        ) : null}
      </div>
      <div className={styles.detailBody}>{post.content}</div>

      <h2 className={styles.sectionTitle}>{interactionLabels.sectionWithCount(comments.length)}</h2>
      {comments.length === 0 ? (
        <p className={styles.hint}>{interactionLabels.emptyHint}</p>
      ) : (
        comments.map((c) => {
          const mine = myId != null && Number(c.userId) === Number(myId);
          return (
            <article key={c.commentId} className={styles.commentBox}>
              <div className={styles.commentMeta}>
                {c.userNickname || '익명'} · {formatDateTime(c.createdAt)}
                {mine ? (
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    style={{ marginLeft: 8, padding: '4px 10px', fontSize: 12 }}
                    onClick={() => handleDeleteComment(c)}
                  >
                    삭제
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.reportLinkBtn}
                    onClick={() => openCommentReport(c)}
                  >
                    신고
                  </button>
                )}
              </div>
              <p className={styles.commentText}>{c.content}</p>
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
          <div className={styles.rowActions}>
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
