import React from 'react';

const cx = (...names) => names.filter(Boolean).join(' ');

function SummaryCard({
  label = '',
  value = '-',
  description = '',
  trend = '',
  trendLabel = '',
  icon = null,
  variant = 'default',
  className = '',
  onClick,
  href,
  loading = false,
}) {
  const isButton = typeof onClick === 'function';
  const isLink = typeof href === 'string' && href.trim().length > 0;

  const classes = cx(
    'summary-card',
    `summary-card--${variant || 'default'}`,
    (isButton || isLink) && 'is-clickable',
    loading && 'is-loading',
    className
  );

  const content = (
    <>
      <div className="summary-card__glow" aria-hidden="true" />

      <div className="summary-card__header">
        {icon ? (
          <div className="summary-card__icon" aria-hidden="true">
            {icon}
          </div>
        ) : (
          <div className="summary-card__icon summary-card__icon--dot" aria-hidden="true" />
        )}

        {trend ? (
          <div
            className={cx(
              'summary-card__trend',
              String(trend).trim().startsWith('-') ? 'is-negative' : 'is-positive'
            )}
          >
            <span>{trend}</span>
            {trendLabel ? <small>{trendLabel}</small> : null}
          </div>
        ) : null}
      </div>

      <div className="summary-card__body">
        <p className="summary-card__label">{label}</p>
        <strong className="summary-card__value">{loading ? '...' : value}</strong>
        {description ? <p className="summary-card__description">{description}</p> : null}
      </div>

      <div className="summary-card__accent" aria-hidden="true" />
    </>
  );

  if (isLink) {
    return (
      <a className={classes} href={href}>
        {content}
      </a>
    );
  }

  if (isButton) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <article className={classes}>{content}</article>;
}

export default React.memo(SummaryCard);
