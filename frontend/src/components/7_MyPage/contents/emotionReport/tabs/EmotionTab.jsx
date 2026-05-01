/**
 * [파일 역할]
 * - 감정 리포트 탭 본문 화면
 * - 캐릭터 선택, 대표 리포트, 통계 카드, 감정 분포 차트,
 *   자주 나온 주제, 핵심 감정 해석을 보여줌
 *
 * [여기서 찾을 것]
 * - 도넛 차트 계산: buildDonutSegments / describeArc
 * - 숫자 애니메이션: AnimatedValue
 * - 현재 선택된 캐릭터: activeHero
 * - 실제 화면 렌더링: function EmotionTab
 *
 * [수정 포인트]
 * - 캐릭터 이름/색상/설명 바꾸기: emotionReport.constants.js → FALLBACK_HERO_BOTS
 * - 통계 카드/감정 분포/핵심 감정 바꾸기: emotionReport.fallback.js → FALLBACK_EMOTION_DATA
 * - 차트 스타일 바꾸기: describeArc, buildDonutSegments 함수
 *
 * [이전 대비 달라진 점]
 * - FALLBACK_HERO_BOTS → constants.js에서 import
 * - CHARACTER_IMAGE_MAP → constants.js에서 import
 * - FALLBACK_EMOTION_DATA → fallback.js에서 import
 * - splitAnimatedValue → utils.js에서 import
 * - 이 파일에는 "화면 렌더링 + 차트 로직"만 남음
 */

import React, { useEffect, useMemo, useState } from 'react';
import styles from './EmotionTab.module.css';

/* =========================
   상수, 유틸, 더미 데이터를 공용 파일에서 가져옴
========================= */
import {
  FALLBACK_HERO_BOTS,
  CHARACTER_IMAGE_MAP,
} from '../../../hooks/emotionReport/emotionReport.constants';

import {
  splitAnimatedValue,
} from '../../../hooks/emotionReport/emotionReport.utils';

import {
  FALLBACK_EMOTION_DATA,
} from '../../../hooks/emotionReport/emotionReport.fallback';

/* =========================
   도넛 차트 비율 계산 함수
   - 감정 분포 데이터를 받아서 각 항목이 차트에서 차지할 비율을 계산
   *
   * 예시:
   * 입력: [{ value: 28 }, { value: 26 }, { value: 24 }, { value: 22 }]
   * 출력: [{ start: 0, portion: 0.28 }, { start: 0.28, portion: 0.26 }, ...]
   *
   * - start: 이 항목이 시작되는 위치 (0~1 사이 비율)
   * - portion: 이 항목이 차지하는 크기 (0~1 사이 비율)
========================= */
function buildDonutSegments(items = []) {
  /* --- 전체 합계 구하기 --- */
  const total = items.reduce((sum, item) => sum + (item.value || 0), 0);
  if (!total) return [];

  /* --- 각 항목의 시작점과 비율 계산 --- */
  let accumulated = 0;

  return items.map((item) => {
    const value = item.value || 0;
    const start = accumulated / total;
    const portion = value / total;
    accumulated += value;

    return { ...item, start, portion };
  });
}

/* =========================
   SVG 원형 차트에서 좌표를 구하는 함수
   - 각도(degree)를 x, y 좌표로 변환
   - 도넛 차트의 호(arc)를 그리기 위해 필요
   *
   * cx, cy: 원의 중심 좌표
   * r: 원의 반지름
   * angleInDegrees: 각도 (0~360)
========================= */
function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

/* =========================
   SVG 원호(arc) path를 만드는 함수
   - 도넛 차트의 각 조각을 그릴 때 사용
   - SVG의 <path d="..."> 에 들어갈 문자열을 반환
   *
   * cx, cy: 원의 중심
   * r: 반지름
   * startAngle, endAngle: 시작/끝 각도 (0~360)
========================= */
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
}

/* =========================
   숫자 카운트업 애니메이션 컴포넌트
   - 0에서 목표 숫자까지 부드럽게 올라가는 효과
   - 통계 카드, 도넛 차트 중앙 숫자 등에 사용
   *
   * props:
   * - value: 표시할 값 (예: '77%', '12회', '불안')
   * - duration: 애니메이션 시간 (ms, 기본 900)
   * - className: CSS 클래스
   * - decimals: 소수점 자릿수 (기본 0)
   *
   * 동작:
   * - '77%' → 0부터 77까지 카운트업 후 '%' 붙여서 표시
   * - '불안' → 숫자가 아니므로 그냥 텍스트로 표시
========================= */
function AnimatedValue({ value, duration = 900, className, decimals = 0 }) {
  const { numericValue, suffix, hasNumber } = splitAnimatedValue(value);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    /* --- 숫자가 아니면 애니메이션 안 함 --- */
    if (!hasNumber) return undefined;

    let frameId = null;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;

      /* --- 진행률 계산 (0 → 1) --- */
      const progress = Math.min((timestamp - startTime) / duration, 1);

      /* --- easeOutCubic: 처음에 빠르고 끝에서 느려지는 효과 --- */
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = numericValue * eased;

      setDisplayValue(nextValue);

      /* --- 아직 끝나지 않았으면 다음 프레임 예약 --- */
      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    setDisplayValue(0);
    frameId = window.requestAnimationFrame(animate);

    /* --- 컴포넌트가 사라지면 애니메이션 정리 --- */
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [numericValue, duration, hasNumber]);

  /* --- 숫자가 아니면 텍스트 그대로 표시 --- */
  if (!hasNumber) {
    return <span className={className}>{value}</span>;
  }

  /* --- 숫자 + 단위 조합해서 표시 --- */
  const finalText =
    decimals > 0
      ? `${displayValue.toFixed(decimals)}${suffix}`
      : `${Math.round(displayValue)}${suffix}`;

  return <span className={className}>{finalText}</span>;
}

/* =========================
   메인 컴포넌트
   - 캐릭터 선택 → 리포트 → 통계 → 차트 → 주제 → 핵심 해석
   순서로 화면을 보여줌
========================= */
function EmotionTab({
  data,
  reportData,
  botOptions = [],
  selectedBotKey,
  selectedPeriod,
  onBotChange,
}) {
  /* =========================
     사용할 원본 데이터 결정
     - props로 받은 data가 있으면 사용
     - 없으면 reportData.emotionTab 사용
     - 그것도 없으면 더미 데이터 사용
  ========================= */
  const sourceData =
    data || reportData?.emotionTab || FALLBACK_EMOTION_DATA;

  /* =========================
     봇 클릭 시 호출할 함수
  ========================= */
  const changeBot = onBotChange ?? (() => {});

  /* =========================
     sourceData에서 필요한 값 꺼내기
     - 각 값이 없으면 더미 데이터에서 가져옴
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
     - heroBots 데이터에 botOptions 정보를 합침
     - 이미지 경로가 없으면 CHARACTER_IMAGE_MAP에서 기본값 보정
  ========================= */
  const resolvedHeroBots = useMemo(() => {
    const fromData =
      Array.isArray(heroBots) && heroBots.length > 0
        ? heroBots
        : FALLBACK_HERO_BOTS;

    return fromData.map((hero) => {
      /* --- botOptions에서 같은 key를 가진 봇 찾기 --- */
      const botOption =
        botOptions.find((item) => item?.key === hero.key) || {};

      return {
        ...hero,
        ...botOption,
        /* --- 이미지 경로: 여러 후보 중 첫 번째 유효한 값 --- */
        imageUrl:
          hero.imageUrl ||
          botOption.imageUrl ||
          CHARACTER_IMAGE_MAP[hero.key] ||
          '',
        /* --- 이미지 위치 보정 --- */
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
     - selectedBotKey로 찾기 → selectedHero로 찾기 → 첫 번째 → 기본값
  ========================= */
  const activeHero =
    resolvedHeroBots.find((bot) => bot.key === selectedBotKey) ||
    resolvedHeroBots.find((bot) => bot.key === selectedHero?.key) ||
    resolvedHeroBots[0] ||
    FALLBACK_HERO_BOTS[0];

  /* =========================
     감정 분포 도넛 차트 데이터 계산
  ========================= */
  const donutSegments = useMemo(
    () => buildDonutSegments(emotionDistribution.items || []),
    [emotionDistribution.items]
  );

  /* =========================
     타임라인 미리보기 (최대 3개)
  ========================= */
  const timelinePreview = useMemo(
    () => (summaryTimeline || []).slice(0, 3),
    [summaryTimeline]
  );

  /* =========================
     선택 기간 한글 문구 변환
     - '7d' → '최근 7일'
  ========================= */
  const selectedPeriodLabel =
    selectedPeriod === '90d'
      ? '최근 90일'
      : selectedPeriod === '30d'
        ? '최근 30일'
        : '최근 7일';

  /* =========================
     주제 태그 요약 문구
     - 태그가 있으면 앞 3개를 '·'로 이어붙임
  ========================= */
  const reportTopicSummary =
    (topicTags || []).length > 0
      ? `${topicTags.slice(0, 3).join(' · ')} 중심의 감정 대화가 반복됐어요.`
      : '반복 주제가 쌓이면 이 영역에 자동으로 정리돼요.';

  /* =========================
     패널 등장 애니메이션 지연값
     - 각 섹션이 순서대로 나타나는 효과
  ========================= */
  const entranceDelayMap = {
    report: '40ms',
    stats: '120ms',
    donut: '200ms',
    topic: '280ms',
    core: '360ms',
  };

  /* =========================
     캐릭터/기간이 바뀔 때 애니메이션 다시 실행하기 위한 key
     - React는 key가 바뀌면 컴포넌트를 새로 만드므로,
       이걸 이용해서 등장 애니메이션을 다시 재생함
  ========================= */
  const animationKey = `${activeHero.key}-${selectedPeriodLabel}`;

  /* =========================
     실제 화면 렌더링
  ========================= */
  return (
    <section className={styles.emotionTab}>
      {/* =========================
          상단 캐릭터 선택 카드
          - 어떤 동물의 리포트를 볼지 고르는 영역
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
          {/* --- 왼쪽: 캐릭터 이미지 + 텍스트 --- */}
          <div className={styles.reportMainColumn}>
            <div className={styles.reportVisual}>
              {activeHero.imageUrl ? (
                <img
                  src={activeHero.imageUrl}
                  alt={`${activeHero.name} 메인 캐릭터`}
                  className={styles.reportVisualImage}
                  style={{
                    objectPosition:
                      activeHero.reportObjectPosition || 'center bottom',
                  }}
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
                    {selectedPeriodLabel} 동안 반복된 감정 흐름을{' '}
                    {activeHero.typeLabel} 톤으로 정리했어요.
                  </p>
                </div>
              </div>

              <p className={styles.reportDescription}>{activeHero.summary}</p>

              {/* --- 키워드 칩 (최대 3개) --- */}
              <div className={styles.reportChipRow}>
                {(activeHero.chips || []).slice(0, 3).map((chip) => (
                  <span key={chip} className={styles.reportChip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* --- 오른쪽: 핵심 포인트 3줄 --- */}
          <div className={styles.reportSummaryList}>
            {(activeHero.bullets || []).slice(0, 3).map((point) => (
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
          - 왼쪽: 감정 분포 도넛 차트
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
              {/* --- 도넛 차트 SVG --- */}
              <div className={styles.donutWrap}>
                <svg
                  key={`svg-${animationKey}`}
                  viewBox="0 0 120 120"
                  className={styles.donutChart}
                  role="img"
                  aria-label="감정 분포 도넛 차트"
                >
                  {/* --- 배경 원 --- */}
                  <circle
                    cx="60"
                    cy="60"
                    r="42"
                    fill="none"
                    stroke="rgba(228, 221, 247, 0.95)"
                    strokeWidth="14"
                  />

                  {/* --- 각 감정별 호 --- */}
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

                {/* --- 도넛 가운데 총합 숫자 --- */}
                <div className={styles.donutCenter}>
                  <AnimatedValue
                    key={`${animationKey}-donut-total-${emotionDistribution.total || 0}`}
                    value={emotionDistribution.total || 0}
                    className={styles.donutTotal}
                  />
                  <span className={styles.donutCenterLabel}>TOTAL</span>
                </div>
              </div>

              {/* --- 범례 (각 감정 설명) --- */}
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
              <h3 className={styles.panelTitle}>자주 나온 주제</h3>
            </div>
          </div>

          {/* --- 요약 문구 --- */}
          <div className={styles.topicSummaryBox}>
            <span className={styles.topicSummaryLabel}>보고서 요약</span>
            <strong className={styles.topicSummaryText}>
              {reportTopicSummary}
            </strong>
          </div>

          {/* --- 주제 태그 클라우드 --- */}
          <div className={styles.topicCloud}>
            {(topicTags || []).map((tag) => (
              <span key={tag} className={styles.topicTag}>
                {tag}
              </span>
            ))}
          </div>

          {/* --- 타임라인 (최대 3개) --- */}
          <div className={styles.timelineList}>
            {(timelinePreview || []).map((item) => (
              <div key={item.id} className={styles.timelineItem}>
                <span className={styles.timelineIndex}>{item.id}</span>
                <div className={styles.timelineContent}>
                  <strong className={styles.timelineTitle}>{item.title}</strong>
                  <p className={styles.timelineDescription}>
                    {item.description}
                  </p>
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

          {/* --- 리포트 작성 봇 / 누적 감정 수 --- */}
          <div className={styles.coreMetaStrip}>
            <div className={styles.coreMetaBox}>
              <span className={styles.coreMetaLabel}>리포트 작성 봇</span>
              <strong className={styles.coreMetaValue}>
                {activeHero.name}
              </strong>
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

          {/* --- 핵심 감정 태그 --- */}
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
