/**
 * [파일 역할]
 * - 감정 리포트 탭 본문 화면
 * - 캐릭터 선택, 대표 리포트, 통계 카드, 감정 분포 차트,
 *   자주 나온 주제, 핵심 감정 해석을 보여줌
 *
 * [여기서 찾을 것]
 * - 캐릭터 기본 데이터: FALLBACK_HERO_BOTS
 * - 감정 리포트 기본 데이터: FALLBACK_EMOTION_DATA
 * - 도넛 차트 계산: buildDonutSegments / describeArc
 * - 숫자 애니메이션: AnimatedValue
 * - 현재 선택된 캐릭터 계산: activeHero
 * - 실제 화면 렌더링: function EmotionTab
 *
 * [수정 포인트]
 * - 캐릭터 이름/색상/설명 바꾸기: FALLBACK_HERO_BOTS
 * - 통계 카드 바꾸기: FALLBACK_EMOTION_DATA.statCards
 * - 감정 분포 바꾸기: FALLBACK_EMOTION_DATA.emotionDistribution
 * - 핵심 감정 문구 바꾸기: FALLBACK_EMOTION_DATA.coreEmotion
 * - 주제 태그/타임라인 수정: FALLBACK_EMOTION_DATA.topicTags / summaryTimeline
 *
 * [주의]
 * - 이 파일은 "감정 리포트 한 장"을 보여주는 파일
 * - 실제 선택 상태(selectedBotKey, selectedPeriod)는 부모/useEmotionReport에서 들어옴
 */

import React, { useEffect, useMemo, useState } from 'react';
import styles from './EmotionTab.module.css';

/* =========================
   캐릭터 이미지 경로
========================= */
const CHARACTER_IMAGE_MAP = {
  cat: '/images/emotion-report/cat.png',
  bear: '/images/emotion-report/bear.png',
  dog: '/images/emotion-report/dog.png',
  hamster: '/images/emotion-report/hamster.png',
};

/* =========================
   대표 캐릭터 기본 데이터
   - 이름 / 색상 / 설명 / 핵심 문장
   *
   * [수정 포인트]
   * - 캐릭터별 성격, 색상, 카드 문구는 여기서 수정
========================= */
const FALLBACK_HERO_BOTS = [
  {
    key: 'cat',
    name: '냥이',
    typeLabel: '직설형 리포터',
    fallbackLabel: '냥',
    accentColor: '#9A85FF',
    softColor: '#F2ECFF',
    imageUrl: '',
    imagePath: '',
    cardObjectPosition: 'center 14%',
    reportObjectPosition: 'center bottom',
    title: '냥이 피드백',
    summary:
      '감정을 너무 크게 보기보다, 정확히 어디서 흔들렸는지부터 짚어야 해. 지금 필요한 건 예민함이 아니라 해석이야.',
    bullets: [
      '결과 불안이 감정보다 먼저 몸집을 키우는 흐름이 보여.',
      '비교가 시작되면 바로 자책으로 이어지는 연결이 자주 보여.',
      '기준을 조금만 조절해도 전체 감정 흐름이 훨씬 가벼워질 수 있어.',
    ],
    chips: ['현실 점검', '자책 교정', '기준 재정비'],
  },
  {
    key: 'bear',
    name: '곰이',
    typeLabel: '든든한 위로형',
    fallbackLabel: '곰',
    accentColor: '#F3A55C',
    softColor: '#FFF1E4',
    imageUrl: '',
    imagePath: '',
    cardObjectPosition: 'center 18%',
    reportObjectPosition: 'center bottom',
    title: '곰이 리포트',
    summary:
      '지친 날이 있어도 결국 다시 돌아오려는 힘이 보여. 지금은 더 잘하려 하기보다, 버티고 있는 마음을 먼저 안아줘야 해.',
    bullets: [
      '감정이 무거운 날에도 완전히 놓지 않고 다시 돌아오려는 힘이 있어.',
      '해결보다 안정이 먼저 필요한 날이 자주 보여.',
      '자기비판을 줄이면 회복 속도도 더 부드럽게 올라갈 가능성이 커.',
    ],
    chips: ['안정감', '버팀', '따뜻한 위로'],
  },
  {
    key: 'dog',
    name: '강아지',
    typeLabel: '공감·응원형',
    fallbackLabel: '강',
    accentColor: '#7DBBF7',
    softColor: '#ECF6FF',
    imageUrl: '',
    imagePath: '',
    cardObjectPosition: 'center 16%',
    reportObjectPosition: 'center bottom',
    title: '강아지 리포트',
    summary:
      '많이 힘든데도 계속 해보려는 마음이 남아 있어. 그래서 지금은 큰 결론보다 작은 실행 하나를 같이 잡아주는 게 중요해 보여.',
    bullets: [
      '불안이 올라와도 도움을 찾고 다시 움직이려는 흐름이 분명히 있어.',
      '혼자 다 해결하려 할수록 감정 부담이 더 커지는 장면이 보여.',
      '작은 계획으로 쪼개면 훨씬 덜 무겁게 시작할 수 있어.',
    ],
    chips: ['공감', '응원', '작은 실행'],
  },
  {
    key: 'hamster',
    name: '햄이',
    typeLabel: '세심한 생활형',
    fallbackLabel: '햄',
    accentColor: '#C6A5FF',
    softColor: '#F4EEFF',
    imageUrl: '',
    imagePath: '',
    cardObjectPosition: 'center 12%',
    reportObjectPosition: 'center bottom',
    title: '햄이 리포트',
    summary:
      '감정이 생활 리듬하고 같이 흔들리는 패턴이 보여. 마음을 한 번에 바꾸기보다 하루 루틴 하나를 잡는 게 더 효과적일 수 있어.',
    bullets: [
      '수면이나 일상 리듬이 흐트러진 날 감정 반응도 더 커지는 편이야.',
      '작은 루틴 하나만 안정돼도 전체 감정 흐름이 정돈될 수 있어.',
      '거창한 다짐보다 생활 단위의 작은 회복이 더 중요해 보여.',
    ],
    chips: ['루틴', '생활 정리', '잔잔한 회복'],
  },
];

/* =========================
   감정 리포트 기본 더미 데이터
   - 아직 API 연결 전일 때 사용하는 데이터
   *
   * [수정 포인트]
   * - 통계 카드 / 핵심 감정 / 감정 분포 / 태그 / 타임라인 전부 여기서 수정 가능
========================= */
const FALLBACK_EMOTION_DATA = {
  heroBots: FALLBACK_HERO_BOTS,
  selectedHero: FALLBACK_HERO_BOTS[0],
  statCards: [
    {
      id: 'conversation-count',
      label: '대화량',
      value: '12회',
      caption: '선택 기간 동안 기록된 대화 횟수',
    },
    {
      id: 'stability',
      label: '안정도',
      value: '77%',
      caption: '감정이 급격히 무너지지 않은 흐름',
    },
    {
      id: 'recovery',
      label: '회복도',
      value: '74%',
      caption: '감정이 다시 정리되는 힘',
    },
    {
      id: 'acceptance',
      label: '자기수용',
      value: '73%',
      caption: '자책보다 수용으로 이동한 흐름',
    },
  ],
  coreEmotion: {
    title: '복잡한 감정이 생활 리듬과 연결되어 나타나는 패턴이 보여요.',
    description:
      '하루 루틴이 흔들릴 때 감정 반응도 함께 커지는 흐름이 보여서, 마음을 다루는 것과 생활 리듬을 정리하는 일이 같이 필요해 보여요.',
    tags: ['루틴', '불안', '회복', '집중'],
  },
  emotionDistribution: {
    total: 12,
    items: [
      {
        label: '불안',
        value: 28,
        color: '#9A85FF',
        description: '압박과 걱정이 높았던 구간',
      },
      {
        label: '회복',
        value: 26,
        color: '#F2C94C',
        description: '다시 정리되는 흐름',
      },
      {
        label: '안정',
        value: 24,
        color: '#7ED4C7',
        description: '감정이 가라앉은 장면',
      },
      {
        label: '계획',
        value: 22,
        color: '#FFB38A',
        description: '정리와 실행으로 이어진 흐름',
      },
    ],
  },
  topicTags: ['시험', '비교', '불안', '미래', '회복', '루틴', '위로'],
  summaryTimeline: [
    {
      id: 1,
      title: '시험 결과와 비교 불안이 자주 등장한 날',
      description: '외부 기준 때문에 스스로를 과하게 평가한 장면이 있었어요.',
    },
    {
      id: 2,
      title: '지친 마음을 위로받고 싶어한 날',
      description: '해결보다 먼저 감정을 이해받고 싶은 흐름이 보였어요.',
    },
    {
      id: 3,
      title: '생활 리듬 정리가 더 필요했던 날',
      description: '수면과 루틴이 흔들리며 감정 반응도 같이 커졌어요.',
    },
  ],
};

/* =========================
   도넛 차트용 비율 계산 함수
========================= */
function buildDonutSegments(items = []) {
  const total = items.reduce((sum, item) => sum + (item.value || 0), 0);
  if (!total) return [];

  let accumulated = 0;

  return items.map((item) => {
    const value = item.value || 0;
    const start = accumulated / total;
    const portion = value / total;
    accumulated += value;

    return {
      ...item,
      start,
      portion,
    };
  });
}

/* =========================
   SVG 원형 차트 좌표 계산 함수
========================= */
function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

/* =========================
   SVG 원호 path 만드는 함수
========================= */
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
}

/* =========================
   숫자 + 단위 분리 함수
   예: "77%" => 77 / "%"
========================= */
function splitAnimatedValue(rawValue) {
  const text = String(rawValue ?? '');
  const match = text.match(/^(-?\d+(?:\.\d+)?)(.*)$/);

  if (!match) {
    return {
      numericValue: 0,
      suffix: text,
      hasNumber: false,
    };
  }

  return {
    numericValue: Number(match[1]) || 0,
    suffix: match[2] || '',
    hasNumber: true,
  };
}

/* =========================
   숫자 카운트업 애니메이션 컴포넌트
   - 통계 카드 / 분포 / 총합 숫자에 사용
========================= */
function AnimatedValue({ value, duration = 900, className, decimals = 0 }) {
  const { numericValue, suffix, hasNumber } = splitAnimatedValue(value);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!hasNumber) return undefined;

    let frameId = null;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = numericValue * eased;

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    setDisplayValue(0);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [numericValue, duration, hasNumber]);

  if (!hasNumber) {
    return <span className={className}>{value}</span>;
  }

  const finalText =
    decimals > 0
      ? `${displayValue.toFixed(decimals)}${suffix}`
      : `${Math.round(displayValue)}${suffix}`;

  return <span className={className}>{finalText}</span>;
}

/* =========================
   메인 컴포넌트 시작
   - 캐릭터 선택
   - 리포트 본문
   - 통계 카드
   - 감정 분포 차트
   - 자주 나온 주제
   - 핵심 감정 해석
========================= */
function EmotionTab({
  data,
  reportData,
  emotionData,
  botOptions = [],
  selectedBotKey,
  selectedPeriod,
  onBotChange,
  onBotSelect,
}) {
  /* =========================
     사용할 원본 데이터 결정
  ========================= */
  const sourceData =
    data || emotionData || reportData?.emotionTab || FALLBACK_EMOTION_DATA;

  /* =========================
     봇 클릭 시 호출할 함수
     - onBotChange가 있으면 그걸 사용
     - 없으면 onBotSelect 사용
  ========================= */
  const changeBot = onBotChange ?? onBotSelect ?? (() => {});

  /* =========================
     sourceData에서 필요한 값 꺼내기
  ========================= */
  const {
    heroBots = FALLBACK_HERO_BOTS,
    selectedHero,
    statCards = FALLBACK_EMOTION_DATA.statCards,
    coreEmotion = FALLBACK_EMOTION_DATA.coreEmotion,
    emotionDistribution = FALLBACK_EMOTION_DATA.emotionDistribution,
    topicTags = FALLBACK_EMOTION_DATA.topicTags,
    summaryTimeline = FALLBACK_EMOTION_DATA.summaryTimeline,
  } = sourceData;

  /* =========================
     캐릭터 목록 정리
     - heroBots + botOptions 정보 합침
     - 이미지나 위치값 없는 경우 기본값 보정
  ========================= */
  const resolvedHeroBots = useMemo(() => {
    const fromData =
      Array.isArray(heroBots) && heroBots.length > 0 ? heroBots : FALLBACK_HERO_BOTS;

    return fromData.map((hero) => {
      const botOption =
        botOptions.find(
          (item) =>
            item?.key === hero.key ||
            item?.id === hero.key ||
            item?.value === hero.key
        ) || {};

      return {
        ...hero,
        ...botOption,
        imageUrl:
          hero.imageUrl ||
          hero.imagePath ||
          botOption.imageUrl ||
          botOption.imagePath ||
          CHARACTER_IMAGE_MAP[hero.key] ||
          '',
        cardObjectPosition:
          hero.cardObjectPosition ||
          botOption.cardObjectPosition ||
          'center 16%',
        reportObjectPosition:
          hero.reportObjectPosition ||
          botOption.reportObjectPosition ||
          'center bottom',
      };
    });
  }, [heroBots, botOptions]);

  /* =========================
     현재 선택된 캐릭터 계산
  ========================= */
  const activeHero =
    resolvedHeroBots.find((bot) => bot.key === selectedBotKey) ||
    resolvedHeroBots.find((bot) => bot.key === selectedHero?.key) ||
    resolvedHeroBots[0] ||
    FALLBACK_HERO_BOTS[0];

  /* =========================
     감정 분포 차트 데이터 계산
  ========================= */
  const donutSegments = useMemo(
    () => buildDonutSegments(emotionDistribution.items || []),
    [emotionDistribution.items]
  );

  /* =========================
     타임라인은 3개까지만 미리보기로 보여줌
  ========================= */
  const timelinePreview = useMemo(
    () => (summaryTimeline || []).slice(0, 3),
    [summaryTimeline]
  );

  /* =========================
     선택 기간 문구 변환
  ========================= */
  const selectedPeriodLabel =
    selectedPeriod === '90d'
      ? '최근 90일'
      : selectedPeriod === '30d'
        ? '최근 30일'
        : '최근 7일';

  /* =========================
     주제 태그 요약 문구
  ========================= */
  const reportTopicSummary =
    (topicTags || []).length > 0
      ? `${topicTags.slice(0, 3).join(' · ')} 중심의 감정 대화가 반복됐어요.`
      : '반복 주제가 쌓이면 이 영역에 자동으로 정리돼요.';

  /* =========================
     패널 등장 애니메이션 지연값
  ========================= */
  const entranceDelayMap = {
    report: '40ms',
    stats: '120ms',
    donut: '200ms',
    topic: '280ms',
    core: '360ms',
  };

  /* =========================
     캐릭터 / 기간이 바뀔 때 애니메이션 다시 적용하기 위한 key
  ========================= */
  const animationKey = `${activeHero.key}-${selectedPeriodLabel}`;

  /* =========================
     실제 화면 렌더링
  ========================= */
  return (
    <section className={styles.emotionTab}>
      {/* =========================
          상단 캐릭터 선택 카드
          - 어떤 동물 리포트를 볼지 고르는 영역
      ========================= */}
      <div className={styles.heroGrid}>
        {resolvedHeroBots.map((hero) => {
          const isActive = hero.key === activeHero.key;

          return (
            <button
              key={hero.key}
              type="button"
              onClick={() => changeBot(hero.key)}
              className={`${styles.heroCard} ${isActive ? styles.heroCardActive : ''}`}
              style={{
                '--hero-accent': hero.accentColor,
                '--hero-soft': hero.softColor,
              }}
            >
              <div className={styles.heroTop}>
                <div className={styles.portraitWrap}>
                  {hero.imageUrl ? (
                    <img
                      src={hero.imageUrl}
                      alt={`${hero.name} 캐릭터`}
                      className={styles.heroPortrait}
                      style={{
                        objectPosition: hero.cardObjectPosition || 'center 16%',
                      }}
                    />
                  ) : (
                    <div className={styles.heroPlaceholder}>{hero.fallbackLabel}</div>
                  )}
                </div>

                <div className={styles.heroMeta}>
                  <strong className={styles.heroName}>{hero.name}</strong>
                  <span className={styles.heroTone}>{hero.typeLabel}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =========================
          메인 리포트 카드
          - 선택된 캐릭터가 작성한 리포트처럼 보이는 영역
      ========================= */}
      <article
        key={`report-${animationKey}`}
        className={`${styles.selectedReportPanel} ${styles.panelEntrance}`}
        style={{
          '--hero-accent': activeHero.accentColor,
          '--hero-soft': activeHero.softColor,
          '--enter-delay': entranceDelayMap.report,
        }}
      >
        <div className={styles.selectedReportInner}>
          <div className={styles.reportMainColumn}>
            <div className={styles.reportVisual}>
              {activeHero.imageUrl ? (
                <img
                  src={activeHero.imageUrl}
                  alt={`${activeHero.name} 메인 캐릭터`}
                  className={styles.reportVisualImage}
                  style={{
                    objectPosition: activeHero.reportObjectPosition || 'center bottom',
                  }}
                />
              ) : (
                <div className={styles.heroPlaceholder}>{activeHero.fallbackLabel}</div>
              )}
            </div>

            <div className={styles.reportTextBlock}>
              <span className={styles.reportEyebrow}>BOT WRITTEN REPORT</span>

              <div className={styles.reportTitleRow}>
                <div className={styles.reportTitleGroup}>
                  <h3 className={styles.reportTitle}>
                    {activeHero.name}가 작성한 감정 리포트
                  </h3>
                  {/* <p className={styles.reportSubtitle}>
                    {selectedPeriodLabel} 동안 반복된 감정 흐름을 {activeHero.typeLabel} 톤으로
                    정리했어요.
                  </p> */}
                </div>
              </div>

              <p className={styles.reportDescription}>{activeHero.summary}</p>

              {/* <div className={styles.reportChipRow}>
                {(activeHero.chips || []).slice(0, 3).map((chip) => (
                  <span key={chip} className={styles.reportChip}>
                    {chip}
                  </span>
                ))}
              </div> */}
            </div>
          </div>

          <div className={styles.reportSummaryList}>
            {(activeHero.bullets || []).slice(0, 1).map((point) => (
              <div key={point} className={styles.reportSummaryItem}>
                {point}
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* =========================
          통계 카드 영역
          - 대화량, 안정도, 회복도, 자기수용 등
      ========================= */}
      <div
        key={`stats-${animationKey}`}
        className={`${styles.statGrid} ${styles.panelEntrance}`}
        style={{ '--enter-delay': entranceDelayMap.stats }}
      >
        {(statCards || []).map((card) => (
          <article key={card.id} className={styles.statCard}>
            <span className={styles.statLabel}>{card.label}</span>
            <AnimatedValue
              key={`${animationKey}-${card.id}-${card.value}`}
              value={card.value}
              className={styles.statValue}
            />
            <p className={styles.statCaption}>{card.caption}</p>
          </article>
        ))}
      </div>

      {/* =========================
          하단 3개 패널
          - 왼쪽: 감정 분포
          - 가운데: 자주 나온 주제 + 타임라인
          - 오른쪽: 핵심 감정 해석
      ========================= */}
      <div className={styles.bottomPanelGrid}>
        {/* =========================
            감정 분포 도넛 차트
        ========================= */}
        <article
          key={`donut-${animationKey}`}
          className={`${styles.panel} ${styles.donutPanel} ${styles.panelEntrance}`}
          style={{ '--enter-delay': entranceDelayMap.donut }}
        >
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>EMOTION MIX</span>
              <h3 className={styles.panelTitle}>감정 분포</h3>
            </div>
          </div>

          {donutSegments.length > 0 ? (
            <div className={styles.donutLayout}>
              <div className={styles.donutWrap}>
                <svg
                  key={`svg-${animationKey}`}
                  viewBox="0 0 120 120"
                  className={styles.donutChart}
                  role="img"
                  aria-label="감정 분포 도넛 차트"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="42"
                    fill="none"
                    stroke="rgba(228, 221, 247, 0.95)"
                    strokeWidth="14"
                  />

                  {donutSegments.map((segment, index) => {
                    const startAngle = segment.start * 360;
                    const endAngle = (segment.start + segment.portion) * 360;

                    return (
                      <path
                        key={`${animationKey}-${segment.label}`}
                        d={describeArc(60, 60, 42, startAngle, endAngle)}
                        fill="none"
                        stroke={segment.color || '#9A85FF'}
                        strokeWidth="14"
                        strokeLinecap="round"
                        pathLength="100"
                        className={styles.donutSegment}
                        style={{
                          '--segment-delay': `${220 + index * 90}ms`,
                        }}
                      />
                    );
                  })}
                </svg>

                <div className={styles.donutCenter}>
                  <AnimatedValue
                    key={`${animationKey}-donut-total-${emotionDistribution.total || 0}`}
                    value={emotionDistribution.total || 0}
                    className={styles.donutTotal}
                  />
                  <span className={styles.donutCenterLabel}>TOTAL</span>
                </div>
              </div>

              <div className={styles.legendList}>
                {(emotionDistribution.items || []).map((item) => (
                  <div key={item.label} className={styles.legendItem}>
                    <span
                      className={styles.legendColor}
                      style={{ backgroundColor: item.color || '#9A85FF' }}
                    />

                    <div className={styles.legendTextGroup}>
                      <span className={styles.legendLabel}>{item.label}</span>
                      <span className={styles.legendSub}>
                        {item.description || '감정 분포 데이터'}
                      </span>
                    </div>

                    <AnimatedValue
                      key={`${animationKey}-legend-${item.label}-${item.value}`}
                      value={`${item.value}%`}
                      className={styles.legendValue}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyBox}>
              <p>감정 분포 데이터가 아직 없어요.</p>
            </div>
          )}
        </article>

        {/* =========================
            자주 나온 주제 / 타임라인
        ========================= */}
        <article
          key={`topic-${animationKey}`}
          className={`${styles.panel} ${styles.topicPanel} ${styles.panelEntrance}`}
          style={{ '--enter-delay': entranceDelayMap.topic }}
        >
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>TOPICS & TIMELINE</span>
              <h3 className={styles.panelTitle}>자주 나온 주제 top3</h3>
            </div>
          </div>

          <div className={styles.topicSummaryBox}>
            <span className={styles.topicSummaryLabel}>보고서 요약</span>
            <strong className={styles.topicSummaryText}>{reportTopicSummary}</strong>
          </div>

          <div className={styles.topicCloud}>
            {(topicTags || []).map((tag) => (
              <span key={tag} className={styles.topicTag}>
                {tag}
              </span>
            ))}
          </div>

          <div className={styles.timelineList}>
            {(timelinePreview || []).map((item) => (
              <div key={item.id} className={styles.timelineItem}>
                <span className={styles.timelineIndex}>{item.id}</span>
                <div className={styles.timelineContent}>
                  <strong className={styles.timelineTitle}>{item.title}</strong>
                  <p className={styles.timelineDescription}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* =========================
            핵심 감정 해석 카드
        ========================= */}
        <article
          key={`core-${animationKey}`}
          className={`${styles.panel} ${styles.corePanel} ${styles.panelEntrance}`}
          style={{ '--enter-delay': entranceDelayMap.core }}
        >
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>CORE EMOTION</span>
              <h3 className={styles.panelTitle}>핵심 감정 해석</h3>
            </div>
          </div>

          <strong className={styles.coreHeadline}>{coreEmotion.title}</strong>
          <p className={styles.coreDescription}>{coreEmotion.description}</p>

          <div className={styles.coreMetaStrip}>
            <div className={styles.coreMetaBox}>
              <span className={styles.coreMetaLabel}>리포트 작성 봇</span>
              <strong className={styles.coreMetaValue}>{activeHero.name}</strong>
            </div>

            <div className={styles.coreMetaBox}>
              <span className={styles.coreMetaLabel}>누적 감정 수</span>
              <AnimatedValue
                key={`${animationKey}-total-${emotionDistribution.total || 0}`}
                value={emotionDistribution.total || 0}
                className={styles.coreMetaValue}
              />
            </div>
          </div>

          <div className={styles.chipRow}>
            {(coreEmotion.tags || []).map((tag) => (
              <span key={tag} className={styles.topicChip}>
                {tag}
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export default EmotionTab;
