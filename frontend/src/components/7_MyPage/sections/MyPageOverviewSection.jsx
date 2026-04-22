import React, { useMemo } from 'react';
import MyPagePanel from '../components/MyPagePanel';

const toArray = (value) => (Array.isArray(value) ? value : []);

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(toNumber(value, 0));
const formatPoints = (value) => `${formatNumber(value)}P`;
const formatPercent = (value) => `${Math.round(toNumber(value, 0))}%`;

const formatDate = (value) => {
  if (!value) return '기록 없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
};

const normalizeEmotionLabel = (value) => {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return '안정';
  if (['stable', 'calm', 'neutral', 'steady', 'good'].includes(raw)) return '안정';
  if (['happy', 'joy', 'positive'].includes(raw)) return '기쁨';
  if (['anxious', 'anxiety', 'worry', 'stress', 'stressed'].includes(raw)) return '불안';
  if (['sad', 'down', 'depressed'].includes(raw)) return '침잠';
  if (['tired', 'fatigue', 'exhausted'].includes(raw)) return '피로';
  if (['focused', 'focus', 'motivated'].includes(raw)) return '집중';

  return value;
};

const getMoodBadgeStyle = (mood) => {
  const label = normalizeEmotionLabel(mood);

  if (label === '불안') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,245,248,0.92))',
      color: '#b55e7e',
      border: '1px solid rgba(213,106,140,0.14)',
    };
  }

  if (label === '기쁨') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,250,244,0.92))',
      color: '#b37a43',
      border: '1px solid rgba(243,177,131,0.16)',
    };
  }

  if (label === '집중') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,252,249,0.92))',
      color: '#3d8c7d',
      border: '1px solid rgba(115,200,184,0.18)',
    };
  }

  if (label === '피로' || label === '침잠') {
    return {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,245,252,0.92))',
      color: '#6e6488',
      border: '1px solid rgba(141,128,219,0.14)',
    };
  }

  return {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,248,255,0.92))',
    color: '#5d6ea9',
    border: '1px solid rgba(121,174,232,0.18)',
  };
};

const DEFAULT_EMOTION_BARS = [
  { label: '안정', value: 38, color: '#79aee8' },
  { label: '피로', value: 22, color: '#8d80db' },
  { label: '불안', value: 18, color: '#eb8db1' },
  { label: '집중', value: 12, color: '#73c8b8' },
  { label: '기쁨', value: 10, color: '#f3b183' },
];

const normalizeEmotionBars = (source) => {
  const items = toArray(source)
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `emotion-${index}`,
          label: normalizeEmotionLabel(item),
          value: DEFAULT_EMOTION_BARS[index]?.value ?? 0,
          color: DEFAULT_EMOTION_BARS[index]?.color ?? '#8d80db',
        };
      }

      return {
        id: pickFirst(item?.id, `emotion-${index}`),
        label: normalizeEmotionLabel(
          pickFirst(item?.label, item?.name, item?.emotion, `감정 ${index + 1}`)
        ),
        value: toNumber(
          pickFirst(item?.value, item?.percent, item?.percentage, item?.score),
          0
        ),
        color: pickFirst(
          item?.color,
          DEFAULT_EMOTION_BARS[index]?.color,
          '#8d80db'
        ),
      };
    })
    .filter((item) => item.label);

  if (!items.length) return DEFAULT_EMOTION_BARS;

  const hasPositiveValue = items.some((item) => toNumber(item.value, 0) > 0);
  if (!hasPositiveValue) {
    return items.map((item, index) => ({
      ...item,
      value: DEFAULT_EMOTION_BARS[index]?.value ?? 10,
    }));
  }

  return items;
};

const buildDonutStyle = (bars) => {
  const safeBars = normalizeEmotionBars(bars);
  const total = safeBars.reduce((sum, item) => sum + toNumber(item.value, 0), 0);

  if (total <= 0) {
    return {
      background: 'conic-gradient(#79aee8 0 100%)',
    };
  }

  let cursor = 0;
  const segments = safeBars.map((item) => {
    const portion = (toNumber(item.value, 0) / total) * 100;
    const start = cursor;
    const end = cursor + portion;
    cursor = end;
    return `${item.color} ${start}% ${end}%`;
  });

  return {
    background: `conic-gradient(${segments.join(', ')})`,
  };
};

const getDominantEmotion = (bars) => {
  const sorted = [...normalizeEmotionBars(bars)].sort(
    (a, b) => toNumber(b.value, 0) - toNumber(a.value, 0)
  );
  return sorted[0] || DEFAULT_EMOTION_BARS[0];
};

const getInsightText = (emotionLabel) => {
  const label = normalizeEmotionLabel(emotionLabel);

  if (label === '불안') {
    return '이번 주에는 긴장과 걱정 반응이 조금 높게 감지돼요. 짧은 체크인 상담과 호흡 안정 루틴을 먼저 이어가면 좋아요.';
  }

  if (label === '피로') {
    return '감정 기복보다 누적 피로의 영향이 커 보여요. 깊은 대화보다 짧은 회복 중심 상담이 더 잘 맞을 수 있어요.';
  }

  if (label === '침잠') {
    return '에너지가 낮아지는 흐름이 보이지만 패턴을 알고 있다는 점이 중요해요. 리포트 탭에서 변화 시점을 함께 보면 좋아요.';
  }

  if (label === '집중') {
    return '현재 흐름은 비교적 선명하고 정돈되어 있어요. 목표 기반 상담이나 실행 점검형 세션과 잘 맞는 상태예요.';
  }

  if (label === '기쁨') {
    return '긍정 감정이 살아 있는 편이에요. 최근 좋았던 요인을 기록해 두면 컨디션 유지에 도움이 돼요.';
  }

  return '전반적으로 감정 흐름이 차분한 편이에요. 현재의 안정감을 유지하면서 필요한 순간에만 가볍게 점검해도 좋아요.';
};

function MyPageOverviewSection({
  profile = {},
  history = {},
  reports = {},
  billing = {},
  support = {},
  recentSessions = [],
  displayName = 'Matey 사용자',
  loading = false,
  errorMessage = '',
}) {
  const sessions = useMemo(() => {
    const propSessions = toArray(recentSessions);

    if (propSessions.length > 0) return propSessions;

    const list = toArray(
      pickFirst(history?.items, history?.history, history?.sessions, history?.data, [])
    );

    return list.map((item, index) => ({
      id: pickFirst(item?.id, item?.sessionId, `session-${index}`),
      title: pickFirst(item?.title, item?.topic, item?.subject, '상담 기록'),
      summary: pickFirst(
        item?.summary,
        item?.preview,
        item?.description,
        '최근 상담 내용이 여기에 표시됩니다.'
      ),
      mood: normalizeEmotionLabel(pickFirst(item?.mood, item?.emotion, '안정')),
      date: pickFirst(item?.date, item?.createdAt, item?.startedAt, ''),
      counselor: pickFirst(item?.botName, item?.assistantName, item?.counselor, 'Matey AI'),
    }));
  }, [recentSessions, history]);

  const emotionBars = useMemo(
    () =>
      normalizeEmotionBars(
        pickFirst(
          reports?.emotionBars,
          reports?.emotions,
          reports?.weeklyEmotions,
          reports?.chartData,
          []
        )
      ),
    [reports]
  );

  const dominantEmotion = useMemo(() => getDominantEmotion(emotionBars), [emotionBars]);

  const summaryCards = useMemo(
    () => [
      {
        label: '누적 상담',
        value: `${formatNumber(
          pickFirst(
            history?.totalCount,
            history?.total,
            profile?.totalSessions,
            profile?.sessionCount,
            sessions.length,
            0
          )
        )}회`,
      },
      {
        label: '보유 포인트',
        value: formatPoints(
          pickFirst(
            billing?.availablePoints,
            billing?.points,
            billing?.pointBalance,
            profile?.points,
            0
          )
        ),
      },
      {
        label: '현재 플랜',
        value: pickFirst(
          billing?.subscriptionName,
          billing?.planName,
          billing?.plan?.name,
          profile?.subscriptionName,
          'Premium Care'
        ),
      },
      {
        label: '주요 감정',
        value: dominantEmotion?.label || '안정',
      },
    ],
    [history, profile, sessions, billing, dominantEmotion]
  );

  const supportItems = useMemo(() => {
    const list = toArray(
      pickFirst(support?.items, support?.history, support?.tickets, support?.data, [])
    );

    return list.slice(0, 3).map((item, index) => ({
      id: pickFirst(item?.id, item?.ticketId, `support-${index}`),
      title: pickFirst(item?.title, item?.subject, '문의 내역'),
      status: pickFirst(item?.status, item?.state, '대기중'),
      date: pickFirst(item?.createdAt, item?.date, ''),
    }));
  }, [support]);

  const nextBillingText = useMemo(() => {
    return pickFirst(
      billing?.nextBillingDate,
      billing?.renewalDate,
      billing?.subscription?.nextBillingDate,
      ''
    );
  }, [billing]);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <MyPagePanel
        label="Overview"
        title={`${displayName}님의 대시보드`}
        description="최근 상담 흐름과 감정 상태, 결제 및 지원 현황을 빠르게 확인할 수 있어요."
      >
        {loading ? (
          <div className="matey-mypage__empty">데이터를 불러오는 중이에요.</div>
        ) : errorMessage ? (
          <div className="matey-mypage__empty">{errorMessage}</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 14,
            }}
          >
            {summaryCards.map((card) => (
              <article key={card.label} className="matey-mypage__summary-item">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>
        )}
      </MyPagePanel>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.9fr)',
          gap: 24,
        }}
      >
        <MyPagePanel
          label="Emotion"
          title="주간 감정 흐름"
          description="이번 주에 자주 나타난 감정 흐름을 직관적으로 정리했어요."
          smallHead
        >
          {emotionBars.length ? (
            <div style={{ display: 'grid', gap: 16 }}>
              {emotionBars.map((item) => (
                <div key={item.id || item.label} style={{ display: 'grid', gap: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <strong
                      style={{
                        color: 'var(--matey-mypage-title)',
                        fontSize: 15,
                        fontWeight: 800,
                      }}
                    >
                      {item.label}
                    </strong>
                    <span
                      style={{
                        color: 'var(--matey-mypage-text-soft)',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {formatPercent(item.value)}
                    </span>
                  </div>

                  <div
                    style={{
                      height: 12,
                      borderRadius: 999,
                      background: 'rgba(141, 128, 219, 0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(6, toNumber(item.value, 0))}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}CC)`,
                        boxShadow: `0 6px 18px ${item.color}33`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="matey-mypage__empty">표시할 감정 데이터가 없어요.</div>
          )}
        </MyPagePanel>

        <MyPagePanel
          label="Insight"
          title="감정 비율 요약"
          description="지금 흐름에서 가장 먼저 확인하면 좋은 포인트예요."
          smallHead
        >
          <div
            style={{
              display: 'grid',
              gap: 18,
              alignItems: 'center',
              justifyItems: 'center',
            }}
          >
            <div
              style={{
                width: 192,
                height: 192,
                borderRadius: '50%',
                ...buildDonutStyle(emotionBars),
                position: 'relative',
                boxShadow: '0 18px 34px rgba(67, 53, 114, 0.08)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 22,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    color: 'var(--matey-mypage-text-soft)',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Dominant
                </span>
                <strong
                  style={{
                    marginTop: 6,
                    color: 'var(--matey-mypage-title)',
                    fontSize: 24,
                    lineHeight: 1.2,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {dominantEmotion.label}
                </strong>
                <span
                  style={{
                    marginTop: 4,
                    color: 'var(--matey-mypage-text-soft)',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {formatPercent(dominantEmotion.value)}
                </span>
              </div>
            </div>

            <div style={{ width: '100%', display: 'grid', gap: 10 }}>
              {emotionBars.map((item) => (
                <div
                  key={`legend-${item.id || item.label}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(123, 104, 189, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: item.color,
                        boxShadow: `0 0 0 6px ${item.color}1A`,
                      }}
                    />
                    <span
                      style={{
                        color: 'var(--matey-mypage-title)',
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>

                  <span
                    style={{
                      color: 'var(--matey-mypage-text-soft)',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {formatPercent(item.value)}
                  </span>
                </div>
              ))}
            </div>

            <div className="matey-mypage__empty" style={{ textAlign: 'left' }}>
              {getInsightText(dominantEmotion.label)}
            </div>
          </div>
        </MyPagePanel>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
          gap: 24,
        }}
      >
        <MyPagePanel
          label="Recent Sessions"
          title="최근 상담"
          description="가장 최근에 진행한 상담을 빠르게 이어볼 수 있어요."
          smallHead
        >
          {sessions.length ? (
            <div className="matey-mypage__history-list">
              {sessions.slice(0, 3).map((item) => (
                <article key={item.id} className="matey-mypage__history-card">
                  <div className="matey-mypage__history-top">
                    <div>
                      <span className="matey-mypage__history-date">{formatDate(item.date)}</span>
                      <h3>{item.title}</h3>
                    </div>

                    <span
                      className="matey-mypage__mood-badge"
                      style={getMoodBadgeStyle(item.mood)}
                    >
                      {normalizeEmotionLabel(item.mood)}
                    </span>
                  </div>

                  <p>{item.summary}</p>

                  <div className="matey-mypage__tag-list">
                    <span className="matey-mypage__tag">{item.counselor || 'Matey AI'}</span>
                    <span className="matey-mypage__tag">{formatDate(item.date)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="matey-mypage__empty">아직 표시할 상담 내역이 없어요.</div>
          )}
        </MyPagePanel>

        <div style={{ display: 'grid', gap: 24 }}>
          <MyPagePanel
            label="Account"
            title="계정 스냅샷"
            description="구독과 포인트, 다음 결제 상태를 정리했어요."
            smallHead
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <article className="matey-mypage__summary-item">
                <span>구독 플랜</span>
                <strong>
                  {pickFirst(
                    billing?.subscriptionName,
                    billing?.planName,
                    billing?.plan?.name,
                    profile?.subscriptionName,
                    'Premium Care'
                  )}
                </strong>
              </article>

              <article className="matey-mypage__summary-item">
                <span>보유 포인트</span>
                <strong>
                  {formatPoints(
                    pickFirst(
                      billing?.availablePoints,
                      billing?.points,
                      billing?.pointBalance,
                      profile?.points,
                      0
                    )
                  )}
                </strong>
              </article>

              <article className="matey-mypage__summary-item">
                <span>다음 결제</span>
                <strong>{nextBillingText ? formatDate(nextBillingText) : '예정 없음'}</strong>
              </article>

              <article className="matey-mypage__summary-item">
                <span>문의 상태</span>
                <strong>{pickFirst(supportItems[0]?.status, '접수 가능')}</strong>
              </article>
            </div>
          </MyPagePanel>

          <MyPagePanel
            label="Support"
            title="최근 지원 내역"
            description="문의 진행 상태를 빠르게 확인할 수 있어요."
            smallHead
          >
            {supportItems.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {supportItems.map((item) => (
                  <article
                    key={item.id}
                    style={{
                      padding: '16px 16px 15px',
                      borderRadius: 18,
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(251,250,255,0.8))',
                      border: '1px solid rgba(123, 104, 189, 0.08)',
                      boxShadow: 'var(--matey-mypage-shadow-soft)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            display: 'block',
                            color: 'var(--matey-mypage-title)',
                            fontSize: 15,
                            lineHeight: 1.4,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {item.title}
                        </strong>
                        <span
                          style={{
                            display: 'block',
                            marginTop: 6,
                            color: 'var(--matey-mypage-text-soft)',
                            fontSize: 13,
                          }}
                        >
                          {formatDate(item.date)}
                        </span>
                      </div>

                      <span className="matey-mypage__mood-badge">{item.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="matey-mypage__empty">최근 문의 내역이 없어요.</div>
            )}
          </MyPagePanel>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .matey-overview-grid-2col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default React.memo(MyPageOverviewSection);
