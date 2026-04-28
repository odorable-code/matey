/**
 * [파일 용도]
 * 단일 통계 수치나 주요 지표를 강조해서 보여주는 범용 데이터 카드 컴포넌트입니다.
 * 레이블, 메인 수치, 보조 설명(helper)을 포함하며, 강조색(accent)이나 정렬(align) 등을 테마에 맞춰 조절할 수 있습니다.
 */

import React from 'react';
import styles from './StatCard.module.css';

function StatCard({
  label,
  value,
  helper = '',
  accent = 'default',
  align = 'left',
  rightSlot = null,
  className = '',
}) {
  const cardClassName = [
    styles.card,
    accent === 'soft' ? styles.soft : '',
    accent === 'highlight' ? styles.highlight : '',
    align === 'center' ? styles.center : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClassName}>
      <div className={styles.topRow}>
        <span className={styles.label}>{label}</span>
        {rightSlot ? <div className={styles.rightSlot}>{rightSlot}</div> : null}
      </div>

      <strong className={styles.value}>{value}</strong>

      {helper ? <p className={styles.helper}>{helper}</p> : null}
    </article>
  );
}

export default StatCard;
