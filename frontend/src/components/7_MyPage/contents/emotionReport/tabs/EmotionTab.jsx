import React, { useMemo } from 'react';
import styles from './EmotionTab.module.css';

const CHARACTER_IMAGE_MAP = {
  cat: '/images/emotion-report/cat.png',
  bear: '/images/emotion-report/bear.png',
  dog: '/images/emotion-report/dog.png',
  hamster: '/images/emotion-report/hamster.png',
};

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
  emotionFlow: [
    { label: '불안', value: 72 },
    { label: '자책', value: 56 },
    { label: '정리', value: 49 },
    { label: '위로', value: 42 },
    { label: '집중', value: 36 },
  ],
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

function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

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
  const sourceData = data || emotionData || reportData?.emotionTab || FALLBACK_EMOTION_DATA;
  const changeBot = onBotChange ?? onBotSelect ?? (() => {});

  const {
    heroBots = FALLBACK_HERO_BOTS,
    selectedHero,
    statCards = FALLBACK_EMOTION_DATA.statCards,
    coreEmotion = FALLBACK_EMOTION_DATA.coreEmotion,
    emotionDistribution = FALLBACK_EMOTION_DATA.emotionDistribution,
    emotionFlow = FALLBACK_EMOTION_DATA.emotionFlow,
    topicTags = FALLBACK_EMOTION_DATA.topicTags,
    summaryTimeline = FALLBACK_EMOTION_DATA.summaryTimeline,
  } = sourceData;

  const resolvedHeroBots = useMemo(() => {
    const source = Array.isArray(heroBots) && heroBots.length > 0 ? heroBots : FALLBACK_HERO_BOTS;

    return source.map((hero) => ({
      ...hero,
      imageUrl:
        hero.imageUrl ||
        hero.imagePath ||
        CHARACTER_IMAGE_MAP[hero.key] ||
        '',
    }));
  }, [heroBots]);

  const activeHero =
    resolvedHeroBots.find((bot) => bot.key === selectedBotKey) ||
    selectedHero ||
    resolvedHeroBots[0] ||
    FALLBACK_HERO_BOTS[0];

  const donutSegments = useMemo(
    () => buildDonutSegments(emotionDistribution.items || []),
    [emotionDistribution.items]
  );

  const compactFlow = useMemo(() => (emotionFlow || []).slice(0, 5), [emotionFlow]);
  const timelinePreview = useMemo(() => (summaryTimeline || []).slice(0, 3), [summaryTimeline]);

  const maxFlowValue = useMemo(() => {
    if (!compactFlow.length) return 1;
    return Math.max(...compactFlow.map((item) => item.value || 0), 1);
  }, [compactFlow]);

  const selectedPeriodLabel =
    selectedPeriod === '90d'
      ? '최근 90일'
      : selectedPeriod === '30d'
      ? '최근 30일'
      : '최근 7일';

  const reportTopicSummary =
    (topicTags || []).length > 0
      ? `${topicTags.slice(0, 3).join(' · ')} 중심의 감정 대화가 반복됐어요.`
      : '반복 주제가 쌓이면 이 영역에 자동으로 정리돼요.';

  return (
    <section className={styles.emotionTab}>
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
                    />
                  ) : (
                    <div className={styles.heroPlaceholder}>
                      {hero.fallbackLabel}
                    </div>
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

      <article
        className={styles.selectedReportPanel}
        style={{
          '--hero-accent': activeHero.accentColor,
          '--hero-soft': activeHero.softColor,
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
                />
              ) : (
                <div className={styles.heroPlaceholder}>
                  {activeHero.fallbackLabel}
                </div>
              )}
            </div>

            <div className={styles.reportTextBlock}>
              <span className={styles.reportEyebrow}>BOT WRITTEN REPORT</span>

              <div className={styles.reportTitleRow}>
                <div className={styles.reportTitleGroup}>
                  <h3 className={styles.reportTitle}>
                    {activeHero.name}가 작성한 감정 리포트
                  </h3>
                  <p className={styles.reportSubtitle}>
                    {selectedPeriodLabel} 동안 반복된 감정 흐름을 {activeHero.typeLabel} 톤으로 정리했어요.
                  </p>
                </div>
              </div>

              <p className={styles.reportDescription}>{activeHero.summary}</p>

              <div className={styles.reportChipRow}>
                {(activeHero.chips || []).slice(0, 3).map((chip) => (
                  <span key={chip} className={styles.reportChip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.reportSummaryList}>
            {(activeHero.bullets || []).slice(0, 3).map((point) => (
              <div key={point} className={styles.reportSummaryItem}>
                {point}
              </div>
            ))}
          </div>
        </div>
      </article>

      <div className={styles.statGrid}>
        {(statCards || []).map((card) => (
          <article key={card.id} className={styles.statCard}>
            <span className={styles.statLabel}>{card.label}</span>
            <strong className={styles.statValue}>{card.value}</strong>
            <p className={styles.statCaption}>{card.caption}</p>
          </article>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <article className={`${styles.panel} ${styles.corePanel}`}>
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
              <strong className={styles.coreMetaValue}>
                {emotionDistribution.total || 0}
              </strong>
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

        <article className={`${styles.panel} ${styles.donutPanel}`}>
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
                  {donutSegments.map((segment) => {
                    const startAngle = segment.start * 360;
                    const endAngle = (segment.start + segment.portion) * 360;

                    return (
                      <path
                        key={segment.label}
                        d={describeArc(60, 60, 42, startAngle, endAngle)}
                        fill="none"
                        stroke={segment.color || '#9A85FF'}
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>

                <div className={styles.donutCenter}>
                  <strong className={styles.donutTotal}>
                    {emotionDistribution.total || 0}
                  </strong>
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
                    <span className={styles.legendValue}>{item.value}%</span>
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
      </div>

      <div className={styles.insightGrid}>
        <article className={`${styles.panel} ${styles.flowPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>FLOW SNAPSHOT</span>
              <h3 className={styles.panelTitle}>감정 흐름 요약</h3>
            </div>
          </div>

          <div className={styles.flowList}>
            {(compactFlow || []).map((item) => {
              const width = ((item.value || 0) / maxFlowValue) * 100;

              return (
                <div key={item.label} className={styles.flowRow}>
                  <span className={styles.flowLabel}>{item.label}</span>
                  <div className={styles.flowTrack}>
                    <div
                      className={styles.flowFill}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className={styles.flowValue}>{item.value}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.flowMetaGrid}>
            <div className={styles.flowMetaCard}>
              <span className={styles.flowMetaLabel}>대화 수</span>
              <strong className={styles.flowMetaValue}>12회</strong>
              <span className={styles.flowMetaCaption}>선택 기간 기준</span>
            </div>
            <div className={styles.flowMetaCard}>
              <span className={styles.flowMetaLabel}>활동일</span>
              <strong className={styles.flowMetaValue}>6일</strong>
              <span className={styles.flowMetaCaption}>기록이 남은 날</span>
            </div>
            <div className={styles.flowMetaCard}>
              <span className={styles.flowMetaLabel}>반복 주제</span>
              <strong className={styles.flowMetaValue}>관계 · 불안</strong>
              <span className={styles.flowMetaCaption}>자주 나온 키워드</span>
            </div>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.topicPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>TOPICS & TIMELINE</span>
              <h3 className={styles.panelTitle}>자주 나온 주제</h3>
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
      </div>
    </section>
  );
}

export default EmotionTab;
