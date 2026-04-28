/**
 * [파일 용도]
 * 입력받은 감정 데이터의 항목별 비중을 도넛 차트(Donut Chart) 형태로 시각화하고,
 * 각 항목의 수치와 백분율(%)을 범례와 프로그레스 바를 통해 직관적으로 보여주는 리포트 컴포넌트입니다.
 */

import React, { useMemo } from 'react';
import styles from './EmotionDonut.module.css';

const DEFAULT_COLORS = [
  '#9D8CFF',
  '#FFB7D5',
  '#8FD8FF',
  '#FFD59A',
  '#B6E6A8',
  '#C9C4D8',
];

function EmotionDonut({
  title = '감정 분포',
  subtitle = '선택한 기간 기준 감정 비율',
  items = [],
  totalLabel = '전체',
  centerValue = '',
  centerUnit = '',
  size = 220,
  strokeWidth = 28,
}) {
  const normalizedItems = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items
      .map((item, index) => ({
        key: item.key || `item-${index}`,
        label: item.label || `항목 ${index + 1}`,
        value: Math.max(0, Number(item.value) || 0),
        color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      }))
      .filter((item) => item.value > 0);
  }, [items]);

  const total = useMemo(() => {
    return normalizedItems.reduce((sum, item) => sum + item.value, 0);
  }, [normalizedItems]);

  const chartStyle = useMemo(() => {
    if (normalizedItems.length === 0 || total <= 0) {
      return {
        background:
          'conic-gradient(from -90deg, rgba(223, 215, 239, 0.9) 0deg 360deg)',
      };
    }

    let currentAngle = 0;
    const segments = normalizedItems.map((item) => {
      const angle = (item.value / total) * 360;
      const start = currentAngle;
      const end = currentAngle + angle;
      currentAngle = end;
      return `${item.color} ${start}deg ${end}deg`;
    });

    return {
      background: `conic-gradient(from -90deg, ${segments.join(', ')})`,
    };
  }, [normalizedItems, total]);

  const resolvedCenterValue = useMemo(() => {
    if (centerValue !== '' && centerValue !== null && centerValue !== undefined) {
      return centerValue;
    }

    return total > 0 ? `${total}` : '0';
  }, [centerValue, total]);

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>EMOTION DONUT</span>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.content}>
        <div
          className={styles.chartWrap}
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          <div className={styles.chart} style={chartStyle}>
            <div
              className={styles.chartInner}
              style={{
                inset: `${strokeWidth}px`,
              }}
            >
              <span className={styles.centerLabel}>{totalLabel}</span>
              <strong className={styles.centerValue}>{resolvedCenterValue}</strong>
              {centerUnit ? (
                <span className={styles.centerUnit}>{centerUnit}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.legend}>
          {normalizedItems.length > 0 ? (
            normalizedItems.map((item) => {
              const ratio = total > 0 ? Math.round((item.value / total) * 100) : 0;

              return (
                <div key={item.key} className={styles.legendItem}>
                  <div className={styles.legendTop}>
                    <span className={styles.legendLabelWrap}>
                      <span
                        className={styles.legendDot}
                        style={{ backgroundColor: item.color }}
                      />
                      <span className={styles.legendLabel}>{item.label}</span>
                    </span>

                    <strong className={styles.legendValue}>
                      {item.value}
                      <span className={styles.legendUnit}> / {ratio}%</span>
                    </strong>
                  </div>

                  <div className={styles.legendTrack}>
                    <div
                      className={styles.legendFill}
                      style={{
                        width: `${ratio}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              아직 표시할 감정 분포 데이터가 없어요.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default EmotionDonut;
