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
  if (pick === 1) return '/images/mascots/cat.png';
  if (pick === 2) return '/images/mascots/dog.png';
  if (pick === 3) return '/images/mascots/bear.png';
  return '/images/mascots/hamster.png';
}

export default function BotRankingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, authLoading } = useAuth();
  const isAdminLike = useMemo(() => canAccessAdminPage(user), [user]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(null);
  const [sourceDescription, setSourceDescription] = useState('');
  const [entries, setEntries] = useState([]);
  const [recommendedByMe, setRecommendedByMe] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await communityAPI.getYearEndBotRanking();
      setYear(res?.year ?? null);
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

  const subtitle = useMemo(() => {
    const y = year != null ? `${year}년` : '올해';
    return `${y} 기준으로 인기 봇을 모아 보여드려요.`;
  }, [year]);

  const handleRecommend = useCallback(
    async (botId) => {
      if (!isAuthenticated) {
        alert('추천하려면 로그인이 필요해요.');
        navigate('/login', { state: { from: '/bot-ranking' } });
        return;
      }
      if (!botId) return;

      try {
        const res = await communityAPI.toggleBotRecommend(botId);
        const recommended = Boolean(res?.recommended);
        const likeCount = Number.isFinite(Number(res?.likeCount)) ? Number(res.likeCount) : null;

        setRecommendedByMe((prev) => {
          const next = new Set(prev);
          if (recommended) next.add(botId);
          else next.delete(botId);
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
    [isAuthenticated, navigate]
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>BOT RANKING</p>
            <h1 className={styles.title}>인기 봇 랭킹</h1>
            <p className={styles.subtitle}>{subtitle}</p>

            <div className={styles.shortcuts}>
              <p className={styles.shortcutsLabel}>바로가기</p>
              <div className={styles.shortcutsRow}>
                <Link
                  to="/login"
                  state={{ from: '/bot-ranking' }}
                  className={`${styles.shortcutChip} ${styles.shortcutPrimary}`}
                >
                  로그인
                </Link>
                <Link to="/features" className={styles.shortcutChip}>
                  이용방법
                </Link>
                <Link to="/community/notices" className={styles.shortcutChip}>
                  공지·이벤트
                </Link>
                <Link to="/faq" className={styles.shortcutChip}>
                  FAQ
                </Link>
              </div>
            </div>

            {!authLoading && isAuthenticated ? (
              <p className={styles.hint}>마음에 드는 봇을 추천해 보세요.</p>
            ) : (
              <p className={styles.hint}>봇 사진을 눌러 추천할 수 있어요. (로그인 필요)</p>
            )}
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.heroBlob} />
            <div className={styles.heroMascots}>
              <img className={`${styles.mascot} ${styles.mascotA}`} src="/images/mascots/cat.png" alt="" />
              <img className={`${styles.mascot} ${styles.mascotB}`} src="/images/mascots/dog.png" alt="" />
              <img className={`${styles.mascot} ${styles.mascotC}`} src="/images/mascots/bear.png" alt="" />
              <img className={`${styles.mascot} ${styles.mascotD}`} src="/images/mascots/hamster.png" alt="" />
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
              const liked = recommendedByMe.has(e.botId);
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
                      title={liked ? '추천 취소' : '추천하기'}
                    >
                      <img className={styles.avatarImg} src={avatar} alt={`${e.name} 사진`} />
                      <span className={styles.recoOverlay}>
                        {liked ? '추천됨' : '추천'}
                      </span>
                    </button>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.botName}>{e.name}</h3>
                    {e.description ? <p className={styles.botDesc}>{e.description}</p> : null}

                    <div className={styles.metaRow}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>추천</span>
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
                      <button
                        type="button"
                        className={`${styles.recoBtn} ${liked ? styles.recoBtnOn : ''}`}
                        onClick={() => handleRecommend(e.botId)}
                      >
                        {liked ? '추천 취소' : '추천하기'}
                      </button>
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

