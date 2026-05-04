import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { communityAPI } from '../../utils/api';
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

function CommunityNoticesPage() {
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
          <p className={styles.pageSubtitle}>운영 공지사항을 모아 보여 드려요.</p>
        </div>
      </div>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      {loading ? (
        <p className={styles.hint}>불러오는 중이에요…</p>
      ) : items.length === 0 ? (
        <p className={styles.hint}>등록된 공지가 없어요.</p>
      ) : (
        <div className={styles.postList}>
          {items.map((n) => (
            <article key={n.noticeId ?? n.title} className={styles.postCard}>
              <div className={styles.postMeta}>
                <span>공지</span>
                {n.publishedAt ? <span>{formatDateTime(n.publishedAt)}</span> : null}
              </div>
              <h2 className={styles.postTitle}>{n.title}</h2>
              {n.content ? (
                <p className={styles.postExcerpt} style={{ whiteSpace: 'pre-wrap' }}>
                  {n.content}
                </p>
              ) : null}
            </article>
          ))}
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
