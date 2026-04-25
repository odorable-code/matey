import React, { useEffect, useMemo, useState } from 'react';
import styles from './EmotionReportContent.module.css';

const defaultReport = {
  periodLabel: '최근 7일',
  summary: '이번 주는 불안이 잦아들고, 일상을 다시 정리하려는 흐름이 더 많이 보여요.',
  quote: '조금 덜 흔들리고, 조금 더 회복하는 쪽으로 가고 있어요.',
  topics: ['진로', '관계', '루틴', '불안 완화', '수면'],
  segments: [
    { label: '안정', value: 38, color: '#cbb8ff' },
    { label: '기대', value: 24, color: '#f8c6de' },
    { label: '피곤', value: 18, color: '#ffe1a8' },
    { label: '불안', value: 12, color: '#f4b2c6' },
    { label: '기타', value: 8, color: '#bfe7df' },
  ],
  insights: [
    {
      title: '핵심 감정',
      value: '안정',
      note: '가장 오래 머문 감정',
      tone: 'neutral',
    },
    {
      title: '감정 변화',
      value: '-12%',
      note: '불안 표현 빈도 감소',
      tone: 'positive',
    },
    {
      title: '대화 톤',
      value: '차분함',
      note: '짧고 정리된 대화 증가',
      tone: 'neutral',
    },
    {
      title: '회복 포인트',
      value: '루틴',
      note: '생활 흐름 회복 시도',
      tone: 'positive',
    },
  ],
  details: [
    {
      title: '자주 꺼낸 주제',
      value: '진로 · 관계',
      note: '중요한 선택 앞에서 방향을 정리하려는 대화가 많았어요.',
    },
    {
      title: '가장 편안했던 시간',
      value: '밤 시간대',
      note: '하루를 마무리하면서 감정을 정리하는 패턴이 보여요.',
    },
    {
      title: '메이티 제안',
      value: '작은 루틴 고정',
      note: '큰 계획보다 작고 반복 가능한 루틴이 지금은 더 잘 맞아요.',
    },
  ],
};

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function createArcPath(cx, cy, r, startAngle, endAngle) {
  const sweep = endAngle - startAngle;

  if (sweep <= 0.001) {
    const point = polarToCartesian(cx, cy, r, startAngle);
    return `M ${cx} ${cy} L ${point.x} ${point.y} Z`;
  }

  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = sweep <= 180 ? '0' : '1';

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function parseAnimatedValue(rawValue) {
  if (typeof rawValue === 'number') {
    return {
      isAnimatable: true,
      numericValue: rawValue,
      suffix: '',
      prefix: '',
      decimals: Number.isInteger(rawValue) ? 0 : 1,
    };
  }

  if (typeof rawValue !== 'string') {
    return {
      isAnimatable: false,
      text: String(rawValue ?? ''),
    };
  }

  const trimmed = rawValue.trim();

  const percentMatch = trimmed.match(/^([+-]?)(\d+(?:\.\d+)?)%$/);
  if (percentMatch) {
    const sign = percentMatch[1];
    const valueBody = percentMatch[2];
    const numericValue = Number(`${sign}${valueBody}`);

    return {
      isAnimatable: true,
      numericValue,
      suffix: '%',
      prefix: sign === '+' ? '+' : '',
      decimals: valueBody.includes('.') ? valueBody.split('.')[1].length : 0,
    };
  }

  const numberMatch = trimmed.match(/^([+-]?)(\d+(?:\.\d+)?)$/);
  if (numberMatch) {
    const sign = numberMatch[1];
    const valueBody = numberMatch[2];
    const numericValue = Number(`${sign}${valueBody}`);

    return {
      isAnimatable: true,
      numericValue,
      suffix: '',
      prefix: sign === '+' ? '+' : '',
      decimals: valueBody.includes('.') ? valueBody.split('.')[1].length : 0,
    };
  }

  return {
    isAnimatable: false,
    text: trimmed,
  };
}

function formatAnimatedNumber(value, decimals) {
  if (decimals === 0) {
    return Math.round(value).toString();
  }
  return value.toFixed(decimals);
}

function AnimatedMetricValue({
  value,
  delay = 0,
  tone = 'neutral',
  className = '',
}) {
  const parsed = useMemo(() => parseAnimatedValue(value), [value]);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!parsed.isAnimatable) return undefined;

    let frameId;
    let timeoutId;
    let startTime;
    const duration = 820;
    const targetValue = parsed.numericValue;

    const animate = (time) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const raw = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(raw);
      setDisplayValue(targetValue * eased);

      if (raw < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    setDisplayValue(0);

    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(animate);
    }, delay);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [parsed, delay]);

  const toneClass =
    tone === 'positive'
      ? styles.metricPositive
      : tone === 'negative'
      ? styles.metricNegative
      : styles.metricNeutral;

  if (!parsed.isAnimatable) {
    return (
      <strong className={[className, toneClass].filter(Boolean).join(' ')}>
        {parsed.text}
      </strong>
    );
  }

  const isNegativeNumber = parsed.numericValue < 0;
  const signText = isNegativeNumber ? '-' : parsed.prefix;

  return (
    <strong className={[className, toneClass].filter(Boolean).join(' ')}>
      {signText}
      {formatAnimatedNumber(Math.abs(displayValue), parsed.decimals)}
      {parsed.suffix}
    </strong>
  );
}

function AnimatedPieChart({ segments }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId;
    let startTime;
    const duration = 900;

    const animate = (time) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const raw = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(raw);
      setProgress(eased);

      if (raw < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    setProgress(0);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [segments]);

  const total = useMemo(
    () => segments.reduce((sum, item) => sum + item.value, 0),
    [segments]
  );

  const chartData = useMemo(() => {
    let currentAngle = 0;

    return segments.map((segment) => {
      const sweep = (segment.value / total) * 360;
      const realStart = currentAngle;
      const realEnd = currentAngle + sweep;
      currentAngle = realEnd;

      return {
        ...segment,
        realStart,
        realEnd,
      };
    });
  }, [segments, total]);

  const dominant = useMemo(() => {
    if (!chartData.length) return null;
    return [...chartData].sort((a, b) => b.value - a.value)[0];
  }, [chartData]);

  return (
    <div className={styles.animatedChartWrap} data-reveal-skip="true">
      <svg
        viewBox="0 0 340 340"
        className={styles.chartSvg}
        role="img"
        aria-label="감정 분포 파이차트"
      >
        <defs>
          <filter
            id="emotionPieShadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0"
              dy="12"
              stdDeviation="12"
              floodColor="rgba(133,108,178,0.18)"
            />
          </filter>
        </defs>

        <g filter="url(#emotionPieShadow)">
          {chartData.map((segment) => {
            const animatedStart = segment.realStart * progress;
            const animatedEnd = segment.realEnd * progress;

            return (
              <path
                key={segment.label}
                d={createArcPath(170, 170, 108, animatedStart, animatedEnd)}
                fill={segment.color}
                className={styles.chartSlice}
              />
            );
          })}

          <circle
            cx="170"
            cy="170"
            r="64"
            fill="rgba(255,255,255,0.97)"
            className={styles.chartCenter}
            style={{
              transform: `scale(${0.86 + progress * 0.14})`,
              transformOrigin: '170px 170px',
              opacity: 0.75 + progress * 0.25,
            }}
          />
        </g>

        <text
          x="170"
          y="154"
          textAnchor="middle"
          className={styles.chartCenterLabel}
          style={{ opacity: progress }}
        >
          가장 큰 감정
        </text>
        <text
          x="170"
          y="182"
          textAnchor="middle"
          className={styles.chartCenterValue}
          style={{ opacity: progress }}
        >
          {dominant?.label ?? ''}
        </text>
        <text
          x="170"
          y="206"
          textAnchor="middle"
          className={styles.chartCenterPercent}
          style={{ opacity: progress }}
        >
          {dominant?.value ?? 0}%
        </text>
      </svg>
    </div>
  );
}

function AnimatedLegendRow({ segment, index }) {
  const rowDelay = 220 + index * 90;
  const metricDelay = rowDelay + 50;

  return (
    <li
      className={`${styles.legendItem} ${styles.legendItemAnimated}`}
      style={{ animationDelay: `${rowDelay}ms` }}
      data-reveal-skip="true"
    >
      <span
        className={styles.legendDot}
        style={{ backgroundColor: segment.color }}
      />
      <span className={styles.legendLabel}>{segment.label}</span>
      <AnimatedMetricValue
        value={`${segment.value}%`}
        delay={metricDelay}
        tone="neutral"
        className={styles.legendValue}
      />
    </li>
  );
}

function EmotionReportContent({ reportData = defaultReport }) {
  return (
    <section className={styles.page}>
      <header className={styles.header} data-reveal-skip="true">
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>EMOTION REPORT</span>
          <h2 className={styles.title}>감정 리포트</h2>
          <p className={styles.description}>{reportData.summary}</p>
        </div>
        <div className={styles.periodBadge}>{reportData.periodLabel}</div>
      </header>

      <div className={styles.topRow}>
        <article className={styles.topicCard}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>자주 이야기한 주제</h3>
            <span className={styles.miniBadge}>TOPIC</span>
          </div>
          <div className={styles.topicList}>
            {reportData.topics.map((topic) => (
              <span key={topic} className={styles.topicTag}>
                {topic}
              </span>
            ))}
          </div>
        </article>

        <article className={styles.quoteCard}>
          <span className={styles.quoteLabel}>메이티 한마디</span>
          <p className={styles.quoteText}>{reportData.quote}</p>
        </article>
      </div>

      <div className={styles.mainGrid}>
        <article className={styles.chartCard}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>감정 분포</h3>
            <span className={styles.miniBadge}>WEEKLY</span>
          </div>

          <div className={styles.chartBody}>
            <AnimatedPieChart segments={reportData.segments} />

            <ul className={styles.legendList}>
              {reportData.segments.map((segment, index) => (
                <AnimatedLegendRow
                  key={segment.label}
                  segment={segment}
                  index={index}
                />
              ))}
            </ul>
          </div>
        </article>

        <div className={styles.insightGrid} data-reveal-skip="true">
          {reportData.insights.map((item, index) => (
            <article key={item.title} className={styles.insightCard}>
              <span className={styles.insightTitle}>{item.title}</span>

              <AnimatedMetricValue
                value={item.value}
                tone={item.tone || 'neutral'}
                delay={item.title === '감정 변화' ? 180 : 90 + index * 60}
                className={styles.insightValue}
              />

              <p className={styles.insightNote}>{item.note}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.detailGrid} data-reveal-skip="true">
        {reportData.details.map((item) => (
          <article key={item.title} className={styles.detailCard}>
            <span className={styles.detailTitle}>{item.title}</span>
            <strong className={styles.detailValue}>{item.value}</strong>
            <p className={styles.detailNote}>{item.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default EmotionReportContent;
