/**
 * [파일 역할]
 * - 마이페이지 > 설정 화면 컴포넌트
 * - 알림 설정 토글, 계정 정보 표시, 로그아웃/탈퇴 버튼 UI 담당
 *
 * [여기서 찾을 것]
 * - 기본 설정값: initialSettings
 * - 계정 정보 표시: accountInfo
 * - 서버에서 설정 불러오기: useEffect
 * - 토글 클릭 처리: toggleSetting
 * - 설정 항목 목록: settingGroups
 *
 * [수정 포인트]
 * - 토글 항목 추가/문구 수정: settingGroups
 * - 기본값 수정: initialSettings
 * - 계정 정보 수정: accountInfo
 * - 서버 연동 키 수정: useEffect / toggleSetting 안 myPageAPI 부분
 *
 * [주의]
 * - 현재는 pushNotice만 서버 업데이트 연결되어 있음
 * - emailNotice, gentleTone, quickReply는 UI 상태만 바뀜
 */

import React, { useEffect, useState } from 'react';
import styles from './SettingsContent.module.css';
import { myPageAPI } from '../../../../utils/api';

/* =========================
   설정 기본값
   - 서버 데이터가 없을 때 먼저 보여줄 값
========================= */
const initialSettings = {
  pushNotice: true,
  emailNotice: false,
  gentleTone: true,
  quickReply: true,
};

/* =========================
   계정 정보 표시용 더미 데이터
   - 나중에 서버 연동하면 이 부분을 교체하면 됨
========================= */
const accountInfo = {
  email: 'sungho@example.com',
  phone: '010-1234-5678',
  linkedDate: '2026-01-05',
};

function SettingsContent() {
  /* =========================
     현재 토글 상태 저장
  ========================= */
  const [settings, setSettings] = useState(initialSettings);

  /* =========================
     설정 화면 처음 열릴 때
     서버에서 설정값 불러오는 코드
     *
     * [지금 연결된 것]
     * - pushNotice만 반영
     *
     * [나중에 추가 가능]
     * - emailNotice
     * - gentleTone
     * - quickReply
  ========================= */
  useEffect(() => {
    myPageAPI
      .getSettings()
      .then((data) => {
        if (data) {
          setSettings((prev) => ({
            ...prev,
            ...data
          }));
        }
      })
      .catch(console.error);
  }, []);

  /* =========================
     토글 버튼 클릭하는 코드
     - 화면 상태를 먼저 바꾸고
     - 필요한 항목만 서버에도 저장
     *
     * [현재 서버 저장되는 것]
     * - pushNotice
  ========================= */
  const toggleSetting = (key) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };

      myPageAPI
        .updateSettings({ [key]: updated[key] })
        .catch(console.error);

      return updated;
    });
  };

  /* =========================
     설정 섹션/항목 목록
     - 화면 문구 바꾸고 싶으면 여기 수정
     - 항목 추가도 여기서 하면 됨
  ========================= */
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

  /* =========================
     설정 화면 UI
     - 왼쪽: 토글 목록
     - 오른쪽: 계정 정보 / 계정 관리
  ========================= */
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
        {/* =========================
            왼쪽 영역: 설정 토글 목록
        ========================= */}
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

        {/* =========================
            오른쪽 영역: 계정 정보 / 계정 관리
        ========================= */}
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
