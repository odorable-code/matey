import React, { useMemo, useState } from "react";
import SettingToggle from "../SettingToggle";
import styles from "./SettingsContent.module.css";

// TODO: API 연동
const dummyUser = {
  nickname: "성호",
  email: "sungho@example.com",
  profileImage: "/images/avatar-default.png",
  loginType: "LOCAL",
};

// TODO: API 연동
const dummyUserSetting = {
  satisfactionPopupEnabled: true,
  satisfactionPopupSnoozedUntil: "2026-04-30",
  botLetterEnabled: true,
};

// TODO: API 연동
const dummyNotificationSettings = [
  {
    notificationTypeId: "attendance_reward",
    label: "출석 알림",
    isEnabled: true,
  },
  {
    notificationTypeId: "weekly_emotion_report",
    label: "주간 감정 리포트",
    isEnabled: true,
  },
  {
    notificationTypeId: "event_news",
    label: "이벤트 소식",
    isEnabled: false,
  },
];

// TODO: API 연동
const dummySocialLogins = ["GOOGLE"];

const providerItems = [
  { key: "KAKAO", label: "카카오" },
  { key: "GOOGLE", label: "구글" },
  { key: "NAVER", label: "네이버" },
];

const loginTypeMap = {
  LOCAL: "이메일",
  KAKAO: "카카오",
  GOOGLE: "구글",
  NAVER: "네이버",
};

function SettingsContent() {
  const [satisfactionPopupEnabled, setSatisfactionPopupEnabled] = useState(
    dummyUserSetting.satisfactionPopupEnabled
  );
  const [botLetterEnabled, setBotLetterEnabled] = useState(
    dummyUserSetting.botLetterEnabled
  );
  const [notificationSettings, setNotificationSettings] = useState(
    dummyNotificationSettings
  );

  const socialStatusMap = useMemo(() => {
    return providerItems.map((provider) => ({
      ...provider,
      connected: dummySocialLogins.includes(provider.key),
    }));
  }, []);

  const handleNotificationToggle = (notificationTypeId) => {
    setNotificationSettings((prev) =>
      prev.map((item) =>
        item.notificationTypeId === notificationTypeId
          ? { ...item, isEnabled: !item.isEnabled }
          : item
      )
    );
  };

  return (
    <section className={styles.container}>
      <h2 className={styles.pageTitle}>설정</h2>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>알림</h3>

        <SettingToggle
          title="만족도 팝업"
          description={
            dummyUserSetting.satisfactionPopupSnoozedUntil
              ? "현재 7일간 숨김 중"
              : ""
          }
          checked={satisfactionPopupEnabled}
          onChange={() =>
            setSatisfactionPopupEnabled((prev) => !prev)
          }
        />

        <SettingToggle
          title="봇 쪽지 알림"
          checked={botLetterEnabled}
          onChange={() => setBotLetterEnabled((prev) => !prev)}
        />

        {notificationSettings.map((item) => (
          <SettingToggle
            key={item.notificationTypeId}
            title={item.label}
            checked={item.isEnabled}
            onChange={() => handleNotificationToggle(item.notificationTypeId)}
          />
        ))}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>계정</h3>

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>이메일</span>
          <span className={styles.infoValueMuted}>{dummyUser.email}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>로그인 방식</span>
          <span className={styles.infoValue}>
            {loginTypeMap[dummyUser.loginType] || dummyUser.loginType}
          </span>
        </div>

        <div className={styles.socialBlock}>
          <div className={styles.socialTitleRow}>
            <span className={styles.infoLabel}>소셜 계정 연결</span>
          </div>

          <div className={styles.socialList}>
            {socialStatusMap.map((provider) => (
              <div key={provider.key} className={styles.socialRow}>
                <span className={styles.socialProvider}>{provider.label}</span>

                <div className={styles.socialRight}>
                  <span
                    className={`${styles.statusBadge} ${
                      provider.connected
                        ? styles.connectedBadge
                        : styles.disconnectedBadge
                    }`}
                  >
                    {provider.connected ? "연결됨" : "미연결"}
                  </span>

                  {!provider.connected ? (
                    <button type="button" className={styles.connectButton}>
                      연결하기
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.sectionLast}>
        <h3 className={styles.sectionTitle}>기타</h3>

        <div className={styles.actionArea}>
          <button type="button" className={styles.logoutButton}>
            로그아웃
          </button>

          <button type="button" className={styles.withdrawButton}>
            회원탈퇴
          </button>
        </div>
      </div>
    </section>
  );
}

export default SettingsContent;
