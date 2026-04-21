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
const formatPercent = (value) => `${Math.round(toNumber(value, 0))}%`;

const formatDate = (value) => {
  if (!value) return '기록 없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
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

const DEFAULT_EMOTION_BARS = [
  { id: 'stable', label: '안정', value: 38, color: '#79aee8' },
  { id: 'fatigue', label: '피로', value: 22, color: '#8d80db' },
  { id: 'anxiety', label: '불안', value: 18, color: '#eb8db1' },
  { id: 'focus', label: '집중', value: 12, color: '#73c8b8' },
  { id: 'joy', label: '기쁨', value: 10, color: '#f3b183' },
];

const DEFAULT_WEEKLY_FLOW = [
  { id: 'mon', label: '월', value: 72 },
  { id: 'tue', label: '화', value: 68 },
  { id: 'wed', label: '수', value: 74 },
  { id: 'thu', label: '목', value: 79 },
  { id: 'fri', label: '금', value: 76 },
  { id: 'sat', label: '토', value: 82 },
  { id: 'sun', label: '일', value: 78 },
];

const DEFAULT_KEYWORDS = ['수면', '스트레스', '관계', '일상 루틴', '집중 회복'];

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
        color: pickFirst(item?.color, DEFAULT_EMOTION_BARS[index]?.color, '#8d80db'),
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

const normalizeWeeklyFlow = (reports) => {
  const source = toArray(
    pickFirst(
      reports?.weeklyFlow,
      reports?.weeklyTrend,
      reports?.stabilityFlow,
      reports?.trendPoints,
      reports?.dailyScores,
      []
    )
  );

  if (!source.length) return DEFAULT_WEEKLY_FLOW;

  const items = source
    .map((item, index) => {
      if (typeof item === 'number') {
        return {
          id: `day-${index}`,
          label: DEFAULT_WEEKLY_FLOW[index]?.label ?? `${index + 1}일`,
          value: toNumber(item, 0),
        };
      }

      return {
        id: pickFirst(item?.id, `day-${index}`),
        label: pickFirst(item?.label, item?.day, item?.name, `${index + 1}일`),
        value: toNumber(
          pickFirst(item?.value, item?.score, item?.stability, item?.percent),
          0
        ),
      };
    })
    .filter((item) => item.label);

  if (!items.length) return DEFAULT_WEEKLY_FLOW;

  const hasPositiveValue = items.some((item) => toNumber(item.value, 0) > 0);
  if (!hasPositiveValue) return DEFAULT_WEEKLY_FLOW;

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

const getWeeklyKeywords = (reports, history) => {
  const raw = pickFirst(
    reports?.keywords,
    reports?.topKeywords,
    reports?.topics,
    reports?.summary?.keywords,
    []
  );

  const reportKeywords = Array.isArray(raw)
    ? raw.map((item) =>
        typeof item === 'string'
          ? item
          : pickFirst(item?.label, item?.name, item?.keyword, '')
      )
    : [];

  if (reportKeywords.filter(Boolean).length) {
    return [...new Set(reportKeywords.filter(Boolean))].slice(0, 6);
  }

  const historyItems = toArray(
    pickFirst(history?.items, history?.history, history?.sessions, history?.data, [])
  );

  const tags = historyItems.flatMap((item) => {
    const rawTags = pickFirst(item?.tags, item?.keywords, item?.topics, []);
    if (Array.isArray(rawTags)) return rawTags;
    return String(rawTags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  });

  const uniqueTags = [...new Set(tags.filter(Boolean))].slice(0, 6);
  return uniqueTags.length ? uniqueTags : DEFAULT_KEYWORDS;
};

const getInsightText = (emotionLabel) => {
  const label = normalizeEmotionLabel(emotionLabel);

  if (label === '불안') {
    return '이번 리포트에서는 긴장 반응이 상대적으로 높게 보입니다. 짧고 가벼운 체크인 상담과 루틴 정리가 먼저 도움이 될 수 있어요.';
  }

  if (label === '피로') {
    return '감정 기복보다 에너지 저하가 먼저 읽혀요. 깊은 상담보다 회복 중심 상담과 휴식 기록이 더 효과적일 수 있어요.';
  }

  if (label === '침잠') {
    return '감정 에너지가 살짝 낮아지는 흐름이에요. 혼자 버티기보다 짧은 상담으로 생각을 정리하는 편이 안정에 도움돼요.';
  }

  if (label === '집중') {
    return '현재 흐름은 비교적 또렷한 편이에요. 문제 해결형 상담이나 목표 기반 세션과 잘 맞는 시기예요.';
  }

  if (label === '기쁨') {
    return '긍정 감정이 잘 유지되고 있어요. 최근 좋았던 조건을 기록해 두면 안정감을 더 오래 유지할 수 있어요.';
  }

  return '전반적으로 감정 흐름이 고르게 유지되고 있어요. 지금의 안정감을 이어가면서 필요한 순간만 점검해도 충분해 보여요.';
};

const getStabilityTone = (value) => {
  const score = toNumber(value, 0);
  if (score >= 80) return '매우 안정적';
  if (score >= 65) return '안정적인 흐름';
  if (score >= 50) return '보통 수준';
  return '세심한 관리 필요';
};

function MyPageReportsSection({
  reports = {},
  history = {},
  displayName = 'Matey 사용자',
  loading = false,
  errorMessage = '',
}) {
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

  const weeklyFlow = useMemo(() => normalizeWeeklyFlow(reports), [reports]);

  const stabilityScore = useMemo(
    () =>
      toNumber(
        pickFirst(
          reports?.stability,
          reports?.stabilityScore,
          reports?.summary?.stability,
          reports?.summary?.stabilityScore,
          76
        ),
        76
      ),
    [reports]
  );

  const reportRangeText = useMemo(
    () =>
      pickFirst(
        reports?.rangeLabel,
        reports?.periodLabel,
        reports?.reportPeriod,
        reports?.summary?.period,
        formatDate(reports?.updatedAt),
        '최근 1주'
      ),
    [reports]
  );

  const keywords = useMemo(() => getWeeklyKeywords(reports, history), [reports, history]);

  const peakDay = useMemo(() => {
    const sorted = [...weeklyFlow].sort((a, b) => toNumber(b.value, 0) - toNumber(a.value, 0));
    return sorted[0] || DEFAULT_WEEKLY_FLOW[0];
  }, [weeklyFlow]);

  const lowDay = useMemo(() => {
    const sorted = [...weeklyFlow].sort((a, b) => toNumber(a.value, 0) - toNumber(b.value, 0));
    return sorted[0] || DEFAULT_WEEKLY_FLOW[1];
  }, [weeklyFlow]);

  const summaryCards = useMemo(
    () => [
      {
        label: '감정 안정도',
        value: formatPercent(stabilityScore),
        helper: getStabilityTone(stabilityScore),
      },
      {
        label: '주요 감정',
        value: dominantEmotion.label,
        helper: `${formatPercent(dominantEmotion.value)} 비중`,
      },
      {
        label: '가장 편안했던 날',
        value: peakDay.label,
        helper: `${formatPercent(peakDay.value)} 흐름`,
      },
      {
        label: '가장 흔들렸던 날',
        value: lowDay.label,
        helper: `${formatPercent(lowDay.value)} 흐름`,
      },
    ],
    [stabilityScore, dominantEmotion, peakDay, lowDay]
  );

  const insightText = useMemo(
    () => getInsightText(dominantEmotion.label),
    [dominantEmotion]
  );

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <MyPagePanel
        label="Reports"
        title="감정리포트"
        description={`${displayName}님의 최근 감정 패턴과 상담 흐름을 보기 쉽게 정리했어요.`}
      >
        {loading ? (
          <div className="matey-mypage__empty">감정 리포트를 불러오는 중이에요.</div>
        ) : errorMessage ? (
          <div className="matey-mypage__empty">{errorMessage}</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
            }}
          >
            {summaryCards.map((card) => (
              <article key={card.label} className="matey-mypage__summary-item">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small
                  style={{
                    display: 'block',
                    marginTop: 8,
                    color: 'var(--matey-mypage-text-soft)',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {card.helper}
                </small>
              </article>
            ))}
          </div>
        )}
      </MyPagePanel>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
          gap: 24,
        }}
      >
        <MyPagePanel
          label="Weekly Flow"
          title="주간 안정도 흐름"
          description={`${reportRangeText} 기준으로 감정 안정감을 부드럽게 비교했어요.`}
          smallHead
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.max(weeklyFlow.length, 1)}, minmax(0, 1fr))`,
              gap: 12,
              alignItems: 'end',
              minHeight: 260,
            }}
          >
            {weeklyFlow.map((item) => (
              <article
                key={item.id}
                style={{
                  display: 'grid',
                  gap: 10,
                  alignItems: 'end',
                  justifyItems: 'center',
                }}
              >
                <span
                  style={{
                    color: 'var(--matey-mypage-text-soft)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {formatPercent(item.value)}
                </span>

                <div
                  style={{
                    width: '100%',
                    maxWidth: 72,
                    height: 170,
                    borderRadius: 24,
                    padding: 6,
                    display: 'flex',
                    alignItems: 'flex-end',
                    background: 'rgba(141, 128, 219, 0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(14, toNumber(item.value, 0))}%`,
                      borderRadius: 18,
                      background:
                        item.value >= 80
                          ? 'linear-gradient(180deg, #73c8b8 0%, #79aee8 100%)'
                          : item.value >= 65
                          ? 'linear-gradient(180deg, #79aee8 0%, #8d80db 100%)'
                          : 'linear-gradient(180deg, #eb8db1 0%, #8d80db 100%)',
                      boxShadow: '0 12px 22px rgba(67, 53, 114, 0.12)',
                    }}
                  />
                </div>

                <strong
                  style={{
                    color: 'var(--matey-mypage-title)',
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </strong>
              </article>
            ))}
          </div>
        </MyPagePanel>

        <MyPagePanel
          label="Distribution"
          title="감정 비율"
          description="이번 기간에 자주 등장한 감정을 비중으로 보여드려요."
          smallHead
        >
          <div
            style={{
              display: 'grid',
              gap: 18,
              justifyItems: 'center',
            }}
          >
            <div
              style={{
                width: 208,
                height: 208,
                borderRadius: '50%',
                position: 'relative',
                ...buildDonutStyle(emotionBars),
                boxShadow: '0 20px 34px rgba(67, 53, 114, 0.08)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 24,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.94)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
                }}
              >
                <span
                  style={{
                    color: 'var(--matey-mypage-text-soft)',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Dominant
                </span>
                <strong
                  style={{
                    marginTop: 6,
                    color: 'var(--matey-mypage-title)',
                    fontSize: 26,
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
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '11px 12px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.78)',
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
          </div>
        </MyPagePanel>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 24,
        }}
      >
        <MyPagePanel
          label="Insight"
          title="AI 해석"
          description="수치만이 아니라 실제 상담 흐름에서 먼저 보면 좋은 포인트를 정리했어요."
          smallHead
        >
          <div
            className="matey-mypage__empty"
            style={{
              textAlign: 'left',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(249,247,255,0.82))',
              borderStyle: 'solid',
            }}
          >
            <strong
              style={{
                display: 'block',
                marginBottom: 10,
                color: 'var(--matey-mypage-title)',
                fontSize: 16,
              }}
            >
              이번 리포트 핵심
            </strong>
            <span style={{ display: 'block' }}>{insightText}</span>
            <span
              style={{
                display: 'block',
                marginTop: 14,
                color: 'var(--matey-mypage-text-soft)',
                fontSize: 13,
              }}
            >
              주요 감정은 <strong style={{ color: 'var(--matey-mypage-title)' }}>{dominantEmotion.label}</strong>,
              안정도는 <strong style={{ color: 'var(--matey-mypage-title)' }}>{formatPercent(stabilityScore)}</strong> 수준으로
              요약돼요.
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginTop: 14,
            }}
          >
            <article className="matey-mypage__summary-item">
              <span>리포트 기준</span>
              <strong>{reportRangeText}</strong>
            </article>
            <article className="matey-mypage__summary-item">
              <span>안정도 평가</span>
              <strong>{getStabilityTone(stabilityScore)}</strong>
            </article>
          </div>
        </MyPagePanel>

        <MyPagePanel
          label="Topics"
          title="자주 나온 키워드"
          description="최근 상담과 리포트에서 반복된 주제를 묶어서 보여드려요."
          smallHead
        >
          {keywords.length ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <div className="matey-mypage__tag-list" style={{ marginTop: 0 }}>
                {keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="matey-mypage__tag"
                    style={{
                      minHeight: 38,
                      padding: '0 14px',
                      fontSize: 13,
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,246,255,0.92))',
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 10,
                }}
              >
                {keywords.slice(0, 4).map((keyword, index) => (
                  <article
                    key={`${keyword}-${index}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '84px minmax(0, 1fr)',
                      gap: 12,
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.76)',
                      border: '1px solid rgba(123, 104, 189, 0.08)',
                    }}
                  >
                    <strong
                      style={{
                        color: 'var(--matey-mypage-text-soft)',
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Topic {index + 1}
                    </strong>
                    <span
                      style={{
                        color: 'var(--matey-mypage-title)',
                        fontSize: 15,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {keyword}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="matey-mypage__empty">표시할 키워드가 없어요.</div>
          )}
        </MyPagePanel>
      </div>
    </div>
  );
}

export default React.memo(MyPageReportsSection);
