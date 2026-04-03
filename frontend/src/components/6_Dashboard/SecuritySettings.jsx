import React, { useState } from 'react';

function SecuritySettings() {
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'Chrome on Windows',
      ip: '192.168.1.1',
      lastActive: '2분 전',
      current: true,
    },
    {
      id: 2,
      device: 'Safari on iOS',
      ip: '203.0.113.45',
      lastActive: '1일 전',
      current: false,
    },
  ]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    alert('비밀번호가 변경되었습니다.');
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const handleLogoutOther = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    alert('해당 세션이 로그아웃되었습니다.');
  };

  return (
    <div className="dashboard-section">
      <h2 className="section-title">보안 설정</h2>
      <p className="section-subtitle">계정을 안전하게 관리하세요</p>

      <div className="security-group">
        <h3>비밀번호 변경</h3>
        
        <div className="security-form-group">
          <label>현재 비밀번호</label>
          <div className="password-input">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              name="current"
              value={passwordForm.current}
              onChange={handlePasswordChange}
              placeholder="현재 비밀번호"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({
                ...prev,
                current: !prev.current
              }))}
            >
              {showPasswords.current ? '숨기기' : '보기'}
            </button>
          </div>
        </div>

        <div className="security-form-group">
          <label>새 비밀번호</label>
          <div className="password-input">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              name="new"
              value={passwordForm.new}
              onChange={handlePasswordChange}
              placeholder="새 비밀번호"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({
                ...prev,
                new: !prev.new
              }))}
            >
              {showPasswords.new ? '숨기기' : '보기'}
            </button>
          </div>
        </div>

        <div className="security-form-group">
          <label>비밀번호 확인</label>
          <div className="password-input">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              name="confirm"
              value={passwordForm.confirm}
              onChange={handlePasswordChange}
              placeholder="비밀번호 확인"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({
                ...prev,
                confirm: !prev.confirm
              }))}
            >
              {showPasswords.confirm ? '숨기기' : '보기'}
            </button>
          </div>
        </div>

        <button className="security-btn" onClick={handlePasswordSubmit}>
          비밀번호 변경
        </button>
      </div>

      <div className="security-group">
        <h3>2단계 인증</h3>
        
        <div className="twofa-item">
          <div className="twofa-info">
            <span className="twofa-label">2단계 인증 활성화</span>
            <span className="twofa-desc">앱을 통한 추가 보안 설정</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="security-group">
        <h3>활성 세션</h3>
        
        <div className="sessions-list">
          {sessions.map((session) => (
            <div key={session.id} className="session-item">
              <div className="session-icon">🖥️</div>
              <div className="session-info">
                <span className="session-device">
                  {session.device}
                  {session.current && <span className="session-current">현재 기기</span>}
                </span>
                <span className="session-meta">{session.ip}</span>
                <span className="session-time">마지막 활동: {session.lastActive}</span>
              </div>
              {!session.current && (
                <button
                  className="logout-btn"
                  onClick={() => handleLogoutOther(session.id)}
                >
                  로그아웃
                </button>
              )}
            </div>
          ))}
        </div>

        <button className="logout-all-btn">모든 기기에서 로그아웃</button>
      </div>
    </div>
  );
}

export default SecuritySettings;
