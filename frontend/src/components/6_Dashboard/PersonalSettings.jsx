import React, { useState } from 'react';

function PersonalSettings() {
  const [settings, setSettings] = useState({
    notificationEmail: true,
    notificationPush: false,
    darkMode: false,
    language: 'ko',
    fontSize: 'medium',
    privacyMonitoring: true,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="dashboard-section">
      <h2 className="section-title">개인 설정</h2>
      <p className="section-subtitle">메이티 이용 환경을 맞춤 설정하세요</p>

      <div className="settings-group">
        <h3>알림 설정</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">이메일 알림</span>
            <span className="setting-desc">중요한 소식을 이메일로 받기</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notificationEmail}
              onChange={() => handleToggle('notificationEmail')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">푸시 알림</span>
            <span className="setting-desc">앱에서 실시간 알림 받기</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notificationPush}
              onChange={() => handleToggle('notificationPush')}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-group">
        <h3>디스플레이 설정</h3>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">다크 모드</span>
            <span className="setting-desc">어두운 테마 사용</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={() => handleToggle('darkMode')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">글자 크기</span>
            <span className="setting-desc">화면 텍스트 크기 조정</span>
          </div>
          <select
            value={settings.fontSize}
            onChange={(e) => handleChange('fontSize', e.target.value)}
            className="setting-select"
          >
            <option value="small">작게</option>
            <option value="medium">보통</option>
            <option value="large">크게</option>
          </select>
        </div>
      </div>

      <div className="settings-group">
        <h3>언어 설정</h3>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">언어</span>
            <span className="setting-desc">앱 언어 선택</span>
          </div>
          <select
            value={settings.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="setting-select"
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </div>

      <div className="settings-group">
        <h3>프라이버시 설정</h3>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">모니터링 활성화</span>
            <span className="setting-desc">화면 감지를 통한 맞춤 상담</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.privacyMonitoring}
              onChange={() => handleToggle('privacyMonitoring')}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default PersonalSettings;
