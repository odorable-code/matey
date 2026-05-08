import React from 'react';
import styles from './NotificationSettingsContent.module.css';
import { useNotifications } from '../../../../contexts/NotificationContext';

/**
 * [파일 역할]
 * - 알림 상세 설정을 위한 독립적인 콘텐츠 컴포넌트
 * - 마이페이지의 상세 페이지로 쓰이거나, 모달 내부에서 재사용됨
 */
function NotificationSettingsContent() {
  const { settings, updateSetting } = useNotifications();

  // 상세 설정 항목 정의 (kakaophoto.png 옵션 기준)
  const detailItems = [
    {
      key: 'noti_BOT_MESSAGE',
      label: '봇 쪽지',
    },
    {
      key: 'noti_CHAT_REMINDER',
      label: '상담 리마인드',
    },
    {
      key: 'noti_COMMENT_REPLY',
      label: '대댓글',
    },
    {
      key: 'noti_COMMUNITY_HOT',
      label: '인기 게시글',
    },
    {
      key: 'noti_EVENT_NOTICE',
      label: '이벤트 알림',
    },
    {
      key: 'noti_POINT_REWARD',
      label: '포인트 지급',
    },
    {
      key: 'noti_POST_COMMENT',
      label: '게시글 댓글',
    },
    {
      key: 'noti_REPORT_RESULT',
      label: '신고 처리 결과',
    },
    {
      key: 'noti_SUPPORT_ANSWER',
      label: '문의 답변',
    },
    {
      key: 'noti_SYSTEM_NOTICE',
      label: '시스템 공지',
    },
  ];

  return (
    <div className={styles.itemList}>
      {detailItems.map((item) => (
        <div key={item.key} className={styles.itemRow}>
          <div className={styles.itemText}>
            <strong className={styles.itemLabel}>{item.label}</strong>
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
  );
}

export default NotificationSettingsContent;
