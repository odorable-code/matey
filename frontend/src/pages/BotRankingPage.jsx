import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './BotRankingPage.module.css';
import { communityAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { canAccessAdminPage } from '../utils/adminAccess';

function normalizeEntries(raw) {
  const rows = Array.isArray(raw) ? raw : [];
  return rows
    .map((r, idx) => {
      const botId = r?.botId ?? r?.bot_id ?? null;
      return {
        ranking: Number.isFinite(Number(r?.ranking)) ? Number(r.ranking) : idx + 1,
        botId: botId != null ? Number(botId) : null,
        name: String(r?.name ?? '').trim(),
        avatarImage: r?.avatarImage ?? r?.avatar_image ?? null,
        description: String(r?.description ?? '').trim(),
        likeCount: Number.isFinite(Number(r?.likeCount)) ? Number(r.likeCount) : null,
        popularityScore: r?.popularityScore ?? null,
        statYear: Number.isFinite(Number(r?.statYear)) ? Number(r.statYear) : null,
      };
    })
    .filter((r) => r.botId != null && r.name);
}

function fallbackAvatarForRank(rank) {
  const pick = (Number(rank) || 0) % 4;
  if (pick === 1) return '/images/mascots/cat/cat.png';
  if (pick === 2) return '/images/mascots/dog/dog.png';
  if (pick === 3) return '/images/mascots/bear/bear.png';
  return '/images/mascots/hamster/hamster.png';
}

export default function BotRankingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, authLoading } = useAuth();
  const isAdminLike = useMemo(() => canAccessAdminPage(user), [user]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [rankDescription, setRankDescription] = useState('');
  const [sourceDescription, setSourceDescription] = useState('');
  const [entries, setEntries] = useState([]);
  const [likedByMe, setLikedByMe] = useState(() => new Set());
  const [dislikedByMe, setDislikedByMe] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await communityAPI.getMonthlyBotRanking();
      setPeriodLabel(String(res?.periodLabel ?? '').trim());
      setRankDescription(String(res?.description ?? '').trim());
      setSourceDescription(String(res?.sourceDescription ?? '').trim());
      setEntries(normalizeEntries(res?.entries));
    } catch (e) {
      setError(e?.message || '불러오지 못했습니다.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLikedByMe(new Set());
      setDislikedByMe(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await communityAPI.getMyBotReactions();
        if (cancelled) return;
        const likes = Array.isArray(res?.likedBotIds)
          ? res.likedBotIds.map((id) => Number(id))
          : [];
        const dislikes = Array.isArray(res?.dislikedBotIds)
          ? res.dislikedBotIds.map((id) => Number(id))
          : [];
        setLikedByMe(new Set(likes));
        setDislikedByMe(new Set(dislikes));
      } catch {
        if (!cancelled) {
          setLikedByMe(new Set());
          setDislikedByMe(new Set());
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  const subtitle = useMemo(() => {
    if (periodLabel) {
      return `${periodLabel} 기준 · 전월 추천·싫어요 반영 집계 순위예요.`;
    }
    return '전월 동안의 봇 반응(추천·싫어요)을 기준으로 순위를 보여 드려요.';
  }, [periodLabel]);

  const handleRecommend = useCallback(
    async (botId) => {
      if (!isAuthenticated) {
        alert('추천하려면 로그인이 필요해요.');
        navigate('/login', { state: { from: '/bot-ranking' } });
        return;
      }
      if (!botId) return;
      if (dislikedByMe.has(botId)) {
        alert('이미 싫어요를 누른 봇이에요.');
        return;
      }
      if (likedByMe.has(botId)) return;

      try {
        const res = await communityAPI.toggleBotRecommend(botId);
        const likeCount = Number.isFinite(Number(res?.likeCount)) ? Number(res.likeCount) : null;

        setLikedByMe((prev) => new Set(prev).add(botId));
        setDislikedByMe((prev) => {
          const next = new Set(prev);
          next.delete(botId);
          return next;
        });

        if (likeCount != null) {
          setEntries((prev) =>
            prev.map((e) => (e.botId === botId ? { ...e, likeCount } : e))
          );
        }
      } catch (e) {
        alert(e?.message || '추천 처리에 실패했어요.');
      }
    },
    [dislikedByMe, isAuthenticated, likedByMe, navigate]
  );

  const handleDislike = useCallback(
    async (botId) => {
      if (!isAuthenticated) {
        alert('로그인이 필요해요.');
        navigate('/login', { state: { from: '/bot-ranking' } });
        return;
      }
      if (!botId) return;
      if (likedByMe.has(botId)) {
        alert('이미 추천한 봇이에요.');
        return;
      }
      if (dislikedByMe.has(botId)) return;

      try {
        await communityAPI.addBotDislike(botId);
        setDislikedByMe((prev) => new Set(prev).add(botId));
        setLikedByMe((prev) => {
          const next = new Set(prev);
          next.delete(botId);
          return next;
        });
      } catch (e) {
        alert(e?.message || '처리에 실패했어요.');
      }
    },
    [dislikedByMe, isAuthenticated, likedByMe, navigate]
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>BOT RANKING</p>
            <h1 className={styles.title}>인기 봇 랭킹</h1>
            <p className={styles.subtitle}>{subtitle}</p>
            {!loading && entries.length > 0 && rankDescription ? (
              <p className={styles.rankHint}>{rankDescription}</p>
            ) : null}

            {!authLoading && !isAuthenticated ? (
              <p className={styles.hint}>로그인하면 추천·싫어요를 남길 수 있어요.</p>
            ) : null}
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.heroBlob} />
            <div className={styles.heroMascots}>
              <img className={`${styles.mascot} ${styles.mascotA}`} src="/images/mascots/cat/cat.png" alt="" />
              <img className={`${styles.mascot} ${styles.mascotB}`} src="/images/mascots/dog/dog.png" alt="" />
              <img className={`${styles.mascot} ${styles.mascotC}`} src="/images/mascots/bear/bear.png" alt="" />
              <img className={`${styles.mascot} ${styles.mascotD}`} src="/images/mascots/hamster/hamster.png" alt="" />
            </div>
            <svg className={styles.heroLines} viewBox="0 0 520 260" fill="none">
              <path
                d="M22 198C120 112 150 214 248 156C340 96 370 182 498 72"
                stroke="rgba(141,121,255,0.35)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M18 218C108 140 172 236 266 176C358 116 398 214 506 98"
                stroke="rgba(121,183,255,0.28)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="498" cy="72" r="10" fill="rgba(255,147,183,0.55)" />
              <circle cx="248" cy="156" r="9" fill="rgba(121,183,255,0.55)" />
              <circle cx="22" cy="198" r="9" fill="rgba(141,121,255,0.55)" />
            </svg>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        {!isAdminLike && sourceDescription ? (
          <p className={styles.sourceHint}>{sourceDescription}</p>
        ) : null}
        {error ? <p className={styles.errorText}>{error}</p> : null}

        {loading ? (
          <p className={styles.loading}>불러오는 중입니다…</p>
        ) : entries.length === 0 ? (
          <p className={styles.loading}>표시할 랭킹 데이터가 아직 없습니다.</p>
        ) : (
          <div className={styles.grid}>
            {entries.map((e) => {
              const liked = likedByMe.has(e.botId);
              const disliked = dislikedByMe.has(e.botId);
              const chose = liked || disliked;
              const avatar = e.avatarImage || fallbackAvatarForRank(e.ranking);
              return (
                <article key={e.botId} className={styles.card}>
                  <div className={styles.cardHead}>
                    <div className={styles.rankPill}>
                      <span className={styles.rankNum}>{e.ranking}</span>
                      <span className={styles.rankSuffix}>위</span>
                    </div>

                    <button
                      type="button"
                      className={styles.avatarBtn}
                      onClick={() => handleRecommend(e.botId)}
                      title={
                        disliked
                          ? '이미 싫어요를 눌렀어요'
                          : liked
                            ? '이미 추천했어요'
                            : '추천하기'
                      }
                    >
                      <img className={styles.avatarImg} src={avatar} alt={`${e.name} 사진`} />
                      <span className={styles.recoOverlay}>
                        {disliked ? '싫어요' : liked ? '추천됨' : '추천'}
                      </span>
                    </button>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.botName}>{e.name}</h3>
                    {e.description ? <p className={styles.botDesc}>{e.description}</p> : null}

                    <div className={styles.metaRow}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>전월 반응</span>
                        <span className={styles.metaValue}>
                          {e.likeCount != null ? e.likeCount : '-'}
                        </span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>점수</span>
                        <span className={styles.metaValue}>
                          {e.popularityScore != null ? String(e.popularityScore) : '-'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.actionsRow}>
                      <Link className={styles.chatLink} to="/chat">
                        채팅하러 가기
                      </Link>
                      <div className={styles.actionBtns}>
                        <button
                          type="button"
                          className={`${styles.recoBtn} ${liked ? styles.recoBtnOn : ''}`}
                          disabled={chose}
                          onClick={() => handleRecommend(e.botId)}
                        >
                          {liked ? '추천됨' : '추천하기'}
                        </button>
                        <button
                          type="button"
                          className={`${styles.dislikeBtn} ${disliked ? styles.dislikeBtnOn : ''}`}
                          disabled={chose}
                          onClick={() => handleDislike(e.botId)}
                        >
                          {disliked ? '싫어요함' : '싫어요'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

