import React from 'react';
import styles from './NotificationSettingsContent.module.css';
import { useNotifications } from '../../../../contexts/NotificationContext';

/**
 * [파일 역할]
 * - 알림 상세 설정을 위한 독립적인 콘텐츠 컴포넌트
 * - 마이페이지의 상세 페이지로 쓰이거나, 모달 내부에서 재사용됨
 * - 브라우저 푸시 알림 허용 토글 포함
 * - DB의 NOTIFICATION_TYPE 10가지 타입별 on/off 설정 지원
 */
function NotificationSettingsContent() {
  const { settings, updateSetting } = useNotifications();

  /** 브라우저 알림 권한 상태 텍스트 */
  const browserPermissionText = (() => {
    if (!('Notification' in window)) return '(브라우저 미지원)';
    if (Notification.permission === 'denied') return '(브라우저에서 차단됨)';
    if (Notification.permission === 'granted') return '';
    return '(허용 필요)';
  })();

  // 상세 설정 항목 정의 — DB NOTIFICATION_TYPE 기준
  const detailItems = [
    {
      key: 'noti_BOT_MESSAGE',
      label: '봇 쪽지',
      desc: '상담봇이 보낸 쪽지 알림',
    },
    {
      key: 'noti_CHAT_REMINDER',
      label: '상담 리마인드',
      desc: '일정 시간 미접속 후 상담 유도',
    },
    {
      key: 'noti_COMMENT_REPLY',
      label: '대댓글',
      desc: '내 댓글에 답글이 작성되었을 때',
    },
    {
      key: 'noti_COMMUNITY_HOT',
      label: '인기 게시글',
      desc: '내 글이 인기글로 선정되었을 때',
    },
    {
      key: 'noti_EVENT_NOTICE',
      label: '이벤트 알림',
      desc: '이벤트 및 출석 보상 관련',
    },
    {
      key: 'noti_POINT_REWARD',
      label: '포인트 지급',
      desc: '포인트가 지급되었을 때',
    },
    {
      key: 'noti_POST_COMMENT',
      label: '게시글 댓글',
      desc: '내 게시글에 댓글이 작성되었을 때',
    },
    {
      key: 'noti_REPORT_RESULT',
      label: '신고 처리 결과',
      desc: '신고 처리가 완료되었을 때',
    },
    {
      key: 'noti_SUPPORT_ANSWER',
      label: '문의 답변',
      desc: '문의에 답변이 등록되었을 때',
    },
    {
      key: 'noti_SYSTEM_NOTICE',
      label: '시스템 공지',
      desc: '운영 공지 및 시스템 알림',
    },
  ];

  return (
    <div className={styles.container}>
      {/* 브라우저 푸시 알림 섹션 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>브라우저 알림</h3>
          <p className={styles.sectionDesc}>
            새 알림이 도착하면 데스크탑 알림으로 알려드려요 {browserPermissionText}
          </p>
        </div>
        <div className={styles.itemRow}>
          <div className={styles.itemText}>
            <strong className={styles.itemLabel}>푸시 알림 허용</strong>
            <span className={styles.itemDesc}>브라우저 알림을 받습니다</span>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${
              settings.pushNotice ? styles.toggleOn : styles.toggleOff
            }`}
            onClick={() => updateSetting('pushNotice', !settings.pushNotice)}
            aria-pressed={settings.pushNotice}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>
      </div>

      {/* 타입별 알림 설정 섹션 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>알림 유형별 설정</h3>
          <p className={styles.sectionDesc}>
            받고 싶은 알림만 켜두세요. 끄면 해당 유형의 알림이 생성되지 않아요.
          </p>
        </div>
        <div className={styles.itemList}>
          {detailItems.map((item) => (
            <div key={item.key} className={styles.itemRow}>
              <div className={styles.itemText}>
                <strong className={styles.itemLabel}>{item.label}</strong>
                <span className={styles.itemDesc}>{item.desc}</span>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${
                  settings[item.key] ? styles.toggleOn : styles.toggleOff
                }`}
                onClick={() => updateSetting(item.key, !settings[item.key])}
                aria-pressed={settings[item.key]}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NotificationSettingsContent;
