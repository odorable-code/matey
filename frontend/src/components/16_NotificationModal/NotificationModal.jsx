/**
 * =========================================================
 * 파일명 : src/components/16_NotificationModal/NotificationModal.jsx
 * 역할   : 헤더 알람 아이콘 아래에 펼쳐지는 알람 Popover (드롭다운)
 * =========================================================
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
  const navigate = useNavigate();

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, anchorRef, closeNotifications]);

  if (!isOpen) return null;

  const resolveLink = (n) => {
    const typeCode = String(n?.typeCode || '').toUpperCase();
    const targetType = String(n?.targetType || '').toUpperCase();
    const targetId = n?.targetId;

    // 운영 공지/이벤트 → 공지·이벤트 피드로
    if (typeCode === 'SYSTEM_NOTICE' || typeCode === 'EVENT_NOTICE') {
      return { path: '/community/notices' };
    }

    // 인기글 → 게시글 상세
    if (typeCode === 'COMMUNITY_HOT') {
      if (targetId != null) return { path: `/community/posts/${targetId}` };
      return { path: '/community' };
    }

    // 댓글/대댓글 알림: target이 POST면 상세로, COMMENT만 있으면 목록으로(추후 postId 확장 가능)
    if (typeCode === 'POST_COMMENT' || typeCode === 'COMMENT_REPLY') {
      if (targetType === 'POST' && targetId != null) {
        return { path: `/community/posts/${targetId}` };
      }
      return { path: '/community' };
    }

    // 문의/신고 답변/신고 결과 → 마이페이지 문의·신고 내역 강조
    if (typeCode === 'SUPPORT_ANSWER' || typeCode === 'REPORT_RESULT') {
      return { path: '/mypage', state: { highlight: 'support' } };
    }

    // 기본: 이동 없음
    return null;
  };

  // -------- 알람 클릭: 읽음 처리 + (가능하면) 링크 이동 --------
  const handleItemClick = async (n) => {
    await markAsRead(n.id);
    const link = resolveLink(n);
    if (link?.path) {
      closeNotifications();
      navigate(link.path, link.state ? { state: link.state } : undefined);
    }
  };

  // -------- 개별 삭제 --------
  const handleRemove = (event, id) => {
    event.stopPropagation();
    removeNotification(id);
  };

  // -------- 설정 페이지 이동 --------
  const handleGoSettings = () => {
    closeNotifications();
    navigate('/mypage', { state: { highlight: 'notiSettings' } });
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
          {/* 설정 버튼: 마이페이지 알림 상세 설정으로 이동 */}
          <button
            type="button"
            className="matey-noti-pop__settings"
            onClick={handleGoSettings}
            aria-label="알림 상세 설정으로 이동"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              marginRight: '8px',
              cursor: 'pointer',
              color: '#847ba0',
              display: 'grid',
              placeItems: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>

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
                    onClick={() => handleItemClick(n)}
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
