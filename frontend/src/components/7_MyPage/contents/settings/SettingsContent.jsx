import React, { useEffect, useState } from 'react';
import styles from './SettingsContent.module.css';
import { myPageAPI } from '../../../utils/api';

const initialSettings = {
  pushNotice: true,
  emailNotice: false,
  gentleTone: true,
  quickReply: true,
};

const accountInfo = {
  email: 'sungho@example.com',
  phone: '010-1234-5678',
  linkedDate: '2026-01-05',
};

function SettingsContent() {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    myPageAPI.getSettings().then(data => {
      if (data) {
        setSettings(prev => ({
          ...prev,
          pushNotice: data.pushNotice ?? prev.pushNotice,
        }));
      }
    }).catch(console.error);
  }, []);

  const toggleSetting = (key) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // Call API to update the setting, only mapping what backend expects
      if (key === 'pushNotice') {
        myPageAPI.updateSettings({ pushNotice: updated.pushNotice }).catch(console.error);
      }
      return updated;
    });
  };

  const settingGroups = [
    {
      title: '알림',
      items: [
        {
          key: 'pushNotice',
          label: '푸시 알림',
          note: '새 편지나 중요한 알림을 바로 받아요.',
        },
        {
          key: 'emailNotice',
          label: '이메일 알림',
          note: '중요 공지를 이메일로도 받아요.',
        },
      ],
    },
    {
      title: '대화 환경',
      items: [
        {
          key: 'gentleTone',
          label: '부드러운 말투 유지',
          note: '메이티가 조금 더 차분한 톤으로 응답해요.',
        },
        {
          key: 'quickReply',
          label: '빠른 답장 모드',
          note: '짧고 빠른 흐름으로 대화를 이어가요.',
        },
      ],
    },
  ];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>SETTINGS</span>
          <h2 className={styles.title}>설정</h2>
          <p className={styles.description}>
            자주 쓰는 항목만 남기고 더 가볍게 정리했어요.
          </p>
        </div>
      </header>

      <div className={styles.layoutGrid}>
        <div className={styles.mainColumn}>
          {settingGroups.map((group) => (
            <article key={group.title} className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <h3 className={styles.sectionTitle}>{group.title}</h3>
              </div>

              <div className={styles.settingList}>
                {group.items.map((item) => (
                  <div key={item.key} className={styles.settingRow}>
                    <div className={styles.settingText}>
                      <strong className={styles.settingLabel}>{item.label}</strong>
                      <p className={styles.settingNote}>{item.note}</p>
                    </div>

                    <button
                      type="button"
                      className={`${styles.toggle} ${
                        settings[item.key] ? styles.toggleOn : styles.toggleOff
                      }`}
                      onClick={() => toggleSetting(item.key)}
                      aria-pressed={settings[item.key]}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className={styles.sideColumn}>
          <article className={styles.infoCard}>
            <h3 className={styles.sectionTitle}>계정 정보</h3>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>이메일</span>
                <strong className={styles.infoValue}>{accountInfo.email}</strong>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>휴대폰 번호</span>
                <strong className={styles.infoValue}>{accountInfo.phone}</strong>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>가입일</span>
                <strong className={styles.infoValue}>{accountInfo.linkedDate}</strong>
              </div>
            </div>
          </article>

          <article className={styles.dangerCard}>
            <h3 className={styles.sectionTitle}>계정 관리</h3>
            <div className={styles.actionList}>
              <button type="button" className={styles.secondaryButton}>
                로그아웃
              </button>
              <button type="button" className={styles.dangerButton}>
                계정 탈퇴
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default SettingsContent;
