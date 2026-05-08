/**
 * [파일 역할]
 * - 마이페이지 > 설정 화면 컴포넌트
 * - 알림 설정 토글, 계정 정보 표시, 로그아웃/탈퇴 버튼 UI 담당
 *
 * [여기서 찾을 것]
 * - 계정 정보 표시: accountInfo
 * - 서버에서 설정 불러오기: useEffect
 * - 토글 클릭 처리: toggleSetting
 * - 설정 항목 목록: settingGroups
 *
 * [수정 포인트]
 * - 토글 항목 추가/문구 수정: settingGroups
 * - 계정 정보 수정: accountInfo
 * - 서버 연동 키 수정: useEffect / toggleSetting 안 myPageAPI 부분
 */

import React, { useEffect, useState } from 'react';
import styles from './SettingsContent.module.css';
import { myPageAPI } from '../../../../utils/api';
import { useNotifications } from '../../../../contexts/NotificationContext';

function SettingsContent({ onSelectMenu }) {
  const { settings, updateSetting } = useNotifications();

  /* =========================
     계정 정보 저장
  ========================= */
  const [userInfo, setUserInfo] = useState({
    email: '-',
    linkedDate: '-',
  });

  /* =========================
     설정 화면 처음 열릴 때
     계정 정보 불러오는 코드 (설정값은 NotificationContext에서 관리)
  ========================= */
  useEffect(() => {
    // 계정 정보 불러오기
    myPageAPI
      .getProfile()
      .then((data) => {
        if (data) {
          setUserInfo({
            email: data.email || '-',
            linkedDate: data.joinedAt || '-',
          });
        }
      })
      .catch(console.error);
  }, []);

  /* =========================
     토글 버튼 클릭하는 코드
  ========================= */
  const toggleSetting = (key) => {
    updateSetting(key, !settings[key]);
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
          key: 'casualTone',
          label: '반말 모드',
          note: '메이티가 친구처럼 편안한 반말로 대화해요.',
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
            왼쪽 영역: 알림 설정 + 계정 정보
        ========================= */}
        <div className={styles.mainColumn}>
          {/* 1. 알림 설정 (기존 첫 번째 그룹) */}
          {settingGroups
            .filter((g) => g.title === '알림')
            .map((group) => (
              <article key={group.title} className={styles.sectionCard}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>{group.title}</h3>
                </div>
                <div className={styles.settingList}>
                  {group.items.map((item) => (
                    <React.Fragment key={item.key}>
                      <div className={styles.settingRow}>
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

                      {item.key === 'pushNotice' && (
                        <div className={styles.buttonRow}>
                          <button
                            type="button"
                            className={styles.actionSubButton}
                            onClick={() => onSelectMenu('notiSettings')}
                          >
                            <div className={styles.settingText}>
                              <strong className={styles.settingLabel}>알림 상세 설정</strong>
                              <p className={styles.settingNote}>받고 싶은 알림 타입을 선택할 수 있어요</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </article>
            ))}

          {/* 2. 계정 정보 (오른쪽에서 이동됨) */}
          <article className={styles.sectionCard}>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionTitle}>계정 정보</h3>
            </div>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>이메일</span>
                <strong className={styles.infoValue}>{userInfo.email}</strong>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>가입일</span>
                <strong className={styles.infoValue}>{userInfo.linkedDate}</strong>
              </div>
            </div>
          </article>
        </div>

        {/* =========================
            오른쪽 영역: 대화 환경 + 계정 관리
        ========================= */}
        <div className={styles.sideColumn}>
          {/* 1. 대화 환경 (왼쪽에서 이동됨) */}
          {settingGroups
            .filter((g) => g.title === '대화 환경')
            .map((group) => (
              <article key={group.title} className={styles.sectionCard}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>{group.title}</h3>
                </div>
                <div className={styles.settingList}>
                  {group.items.map((item) => (
                    <React.Fragment key={item.key}>
                      <div className={styles.settingRow}>
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
                    </React.Fragment>
                  ))}
                </div>
              </article>
            ))}

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
