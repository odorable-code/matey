import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { communityAPI } from 'utils/api';
import { isCommunityStaffPublisher } from 'utils/communityWriteAccess';
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

/** 목록 미리보기: 리치텍스트·줄바꿈 제거 후 글자만 (상세와 동일 본문은 상세에서) */
function excerptPlain(htmlOrText, max = 220) {
  if (htmlOrText == null || htmlOrText === '') return '';
  const plain = String(htmlOrText)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

function CommunityNoticesPage() {
  const { user, authLoading } = useAuth();
  const canWriteStaffPost = !authLoading && isCommunityStaffPublisher(user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const list = await communityAPI.getNotices();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || '공지를 불러오지 못했어요.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className={styles.pageHead}>
        <div className={styles.pageHeadMain}>
          <h1 className={styles.pageTitle}>공지</h1>
          <p className={styles.pageSubtitle}>
            운영 공지와 이벤트 소식을 한곳에서 확인해요.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {canWriteStaffPost ? (
            <Link
              to="/community/write"
              state={{ writeMode: 'NOTICE_EVENT', fromPath: '/community/notices' }}
              className={styles.writeBtn}
            >
              글쓰기
            </Link>
          ) : null}
        </div>
      </div>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      {loading ? (
        <p className={styles.hint}>불러오는 중이에요…</p>
      ) : items.length === 0 ? (
        <p className={styles.hint}>등록된 공지가 없어요.</p>
      ) : (
        <div className={styles.postList}>
          {items.map((n) => {
            const key = n.postId != null ? `post-${n.postId}` : `notice-${n.noticeId ?? n.title}`;
            const badge = n.badge || (n.itemType === 'POST' ? '게시글' : '공지');
            const preview = excerptPlain(n.content);
            const body = (
              <>
                <div className={styles.postMeta}>
                  <span className={styles.noticeBadgePill}>{badge}</span>
                  {n.publishedAt ? <span>{formatDateTime(n.publishedAt)}</span> : null}
                </div>
                <h2 className={styles.postTitle}>{n.title}</h2>
                {preview ? <p className={styles.noticeFeedExcerpt}>{preview}</p> : null}
              </>
            );
            const isBoardPost = n.itemType === 'POST' && n.postId != null;
            return (
              <div key={key} className={`${styles.postCard} ${styles.noticeFeedCard}`}>
                {isBoardPost ? (
                  <Link to={`/community/posts/${n.postId}`} className={styles.postCardLink}>
                    {body}
                  </Link>
                ) : (
                  <div className={styles.postCardLink}>{body}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.homeFooter}>
        <Link to="/community" className={styles.homeLink}>
          ← 커뮤니티
        </Link>
      </div>
    </div>
  );
}

export default CommunityNoticesPage;
