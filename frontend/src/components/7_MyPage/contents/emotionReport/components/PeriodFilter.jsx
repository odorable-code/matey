/**
 * [파일 용도]
 * 감정 리포트의 조회 기간(7일, 30일 등)을 선택할 수 있는 필터링 컴포넌트입니다.
 * 사용자가 선택한 기간에 따라 전체 리포트의 데이터 기준점을 변경하는 트리거 역할을 수행합니다.
 */

import React, { useMemo } from 'react';
import styles from './PeriodFilter.module.css';

const DEFAULT_OPTIONS = [
  { key: '7days', label: '최근 7일', helper: '일주일 흐름' },
  { key: '30days', label: '최근 30일', helper: '한 달 요약' },
  { key: '90days', label: '최근 90일', helper: '장기 변화' },
];

function PeriodFilter({
  title = '기간 선택',
  description = '보고 싶은 리포트 기간을 선택하면 해당 구간 기준으로 감정 흐름과 대화 기록을 정리해 보여줘요.',
  value = '7days',
  options = DEFAULT_OPTIONS,
  onChange,
  rightSlot = null,
}) {
  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options) || options.length === 0) {
      return DEFAULT_OPTIONS;
    }

    return options;
  }, [options]);

  return (
    <section className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.copyBlock}>
          <span className={styles.eyebrow}>{title}</span>
          <p className={styles.description}>{description}</p>
        </div>

        {rightSlot ? <div className={styles.rightSlot}>{rightSlot}</div> : null}
      </div>

      <div
        className={styles.optionList}
        role="radiogroup"
        aria-label="감정 리포트 기간 선택"
      >
        {normalizedOptions.map((option) => {
          const checked = option.key === value;

          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={checked}
              className={`${styles.optionButton} ${checked ? styles.active : ''}`}
              onClick={() => onChange?.(option.key)}
            >
              <span className={styles.optionTextGroup}>
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionHelper}>
                  {option.helper || ''}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default PeriodFilter;
