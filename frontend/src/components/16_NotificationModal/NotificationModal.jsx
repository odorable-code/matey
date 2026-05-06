/**
 * =========================================================
 * 파일명 : src/components/16_NotificationModal/NotificationModal.jsx
 * 역할   : 헤더 알람 아이콘 아래에 펼쳐지는 알람 Popover (드롭다운)
 * =========================================================
 *
 * [이번 수정 핵심]
 * - 모달(중앙 + dim 배경) → Popover (헤더 종 아이콘 아래에 붙음)
 * - dim 오버레이 제거 (채팅 모달과 2중 dim 문제 해결)
 * - 바깥 클릭 / ESC 로 닫힘
 *
 * [주요 위치]
 * - Header.jsx 내부에서 종 버튼 옆에 마운트 (전역 마운트 아님)
 * - 그래야 종 아이콘 기준으로 위치를 정확히 맞출 수 있음
 *
 * [수정 포인트]
 * - 알람 아이템 디자인 : .matey-noti-pop__item
 * - 시간 포맷         : formatTimeAgo
 * - 빈 상태 메시지    : EMPTY_COPY
 * =========================================================
 */

import { useEffect, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationModal.css';

// ============================================================
// 1. 시간 포맷
// ============================================================
function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / (1000 * 60));
  const hour = Math.floor(diff / (1000 * 60 * 60));
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  if (day < 7) return `${day}일 전`;

  const d = new Date(timestamp);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ============================================================
// 2. 타입별 라벨/색상
// ============================================================
const TYPE_META = {
  system: { label: '시스템', accent: 'is-system' },
  mate:   { label: '메이트', accent: 'is-mate' },
  update: { label: '업데이트', accent: 'is-update' },
};

// ============================================================
// 3. 빈 상태 카피
// ============================================================
const EMPTY_COPY = {
  title: '아직 새로운 알림이 없어요',
  description: '메이트의 메모나 시스템 안내가 도착하면 여기로 알려드릴게요.',
};

// ============================================================
// 4. Popover 컴포넌트 (anchorRef 기반)
// ============================================================
function NotificationModal({ anchorRef }) {
  const {
    isOpen,
    notifications,
    unreadCount,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();

  const popoverRef = useRef(null);

  // -------- 바깥 클릭으로 닫기 --------
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      const isInPopover = popoverRef.current?.contains(event.target);
      const isInAnchor = anchorRef?.current?.contains(event.target);
      if (!isInPopover && !isInAnchor) {
        closeNotifications();
      }
    };

    // mousedown 으로 즉시 반응
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, anchorRef, closeNotifications]);

  if (!isOpen) return null;

  // -------- 알람 클릭: 단일 읽음 --------
  const handleItemClick = (id) => markAsRead(id);

  // -------- 개별 삭제 --------
  const handleRemove = (event, id) => {
    event.stopPropagation();
    removeNotification(id);
  };

  return (
    <div
      ref={popoverRef}
      className="matey-noti-pop"
      role="dialog"
      aria-modal="false"
      aria-label="알림 센터"
    >
      {/* 화살표 꼬리 */}
      <span className="matey-noti-pop__arrow" aria-hidden="true" />

      {/* ========================================
          4-1. 헤더
      ======================================== */}
      <header className="matey-noti-pop__header">
        <div className="matey-noti-pop__header-left">
          <span className="matey-noti-pop__header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M12 3a6 6 0 0 0-6 6v3.2c0 .5-.2 1-.6 1.4L4 15h16l-1.4-1.4c-.4-.4-.6-.9-.6-1.4V9a6 6 0 0 0-6-6Z"
                fill="currentColor"
              />
              <path
                d="M10 18a2 2 0 0 0 4 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
          <div>
            <p className="matey-noti-pop__title">알림 센터</p>
            <p className="matey-noti-pop__subtitle">
              {unreadCount > 0
                ? `안 읽은 알림 ${unreadCount}개`
                : '모든 알림을 확인했어요'}
            </p>
          </div>
        </div>

        <div className="matey-noti-pop__header-right">
          {unreadCount > 0 && (
            <button
              type="button"
              className="matey-noti-pop__read-all"
              onClick={markAllAsRead}
            >
              모두 읽음
            </button>
          )}
          <button
            type="button"
            className="matey-noti-pop__close"
            onClick={closeNotifications}
            aria-label="알림 닫기"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ========================================
          4-2. 리스트 / 빈 상태
      ======================================== */}
      <div className="matey-noti-pop__body">
        {notifications.length === 0 ? (
          <div className="matey-noti-pop__empty">
            <div className="matey-noti-pop__empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path
                  d="M12 3a6 6 0 0 0-6 6v3.2c0 .5-.2 1-.6 1.4L4 15h16l-1.4-1.4c-.4-.4-.6-.9-.6-1.4V9a6 6 0 0 0-6-6Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <p className="matey-noti-pop__empty-title">{EMPTY_COPY.title}</p>
            <p className="matey-noti-pop__empty-desc">{EMPTY_COPY.description}</p>
          </div>
        ) : (
          <ul className="matey-noti-pop__list">
            {notifications.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.system;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`matey-noti-pop__item ${meta.accent} ${
                      n.read ? 'is-read' : 'is-unread'
                    }`}
                    onClick={() => handleItemClick(n.id)}
                  >
                    <span className="matey-noti-pop__item-dot" />
                    <div className="matey-noti-pop__item-body">
                      <div className="matey-noti-pop__item-top">
                        <span className="matey-noti-pop__item-tag">
                          {meta.label}
                        </span>
                        <span className="matey-noti-pop__item-time">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="matey-noti-pop__item-title">{n.title}</p>
                      {n.message && (
                        <p className="matey-noti-pop__item-message">
                          {n.message}
                        </p>
                      )}
                    </div>
                    <span
                      className="matey-noti-pop__item-remove"
                      onClick={(e) => handleRemove(e, n.id)}
                      role="button"
                      tabIndex={0}
                      aria-label="이 알림 삭제"
                    >
                      ×
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default NotificationModal;
