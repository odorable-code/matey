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
