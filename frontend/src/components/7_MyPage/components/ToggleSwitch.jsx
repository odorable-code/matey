import React from 'react';

function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  label = '',
  ariaLabel = '토글 스위치',
  className = '',
}) {
  const handleClick = () => {
    if (disabled) return;
    if (typeof onChange === 'function') {
      onChange(!checked);
    }
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (typeof onChange === 'function') {
        onChange(!checked);
      }
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || ariaLabel}
      disabled={disabled}
      className={`matey-mypage__toggle ${checked ? 'is-on' : ''} ${className}`.trim()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span />
    </button>
  );
}

export default React.memo(ToggleSwitch);
