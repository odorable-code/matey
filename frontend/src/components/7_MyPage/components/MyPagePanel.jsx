import React from 'react';

const cx = (...names) => names.filter(Boolean).join(' ');

function MyPagePanel({
  as: Component = 'section',
  label = '',
  title = '',
  description = '',
  actions = null,
  children,
  className = '',
  contentClassName = '',
  headClassName = '',
  bodyClassName = '',
  smallHead = false,
}) {
  return (
    <Component className={cx('matey-mypage__panel', className)}>
      {(label || title || description || actions) && (
        <header
          className={cx(
            'matey-mypage__panel-head',
            smallHead && 'matey-mypage__panel-head--small',
            headClassName
          )}
        >
          <div>
            {label ? <span className="matey-mypage__section-label">{label}</span> : null}
            {title ? <h2>{title}</h2> : null}
            {description ? <p className="matey-mypage__panel-subtitle">{description}</p> : null}
          </div>

          {actions ? <div className="matey-mypage__panel-actions">{actions}</div> : null}
        </header>
      )}

      <div className={cx(contentClassName, bodyClassName)}>{children}</div>
    </Component>
  );
}

export default React.memo(MyPagePanel);
