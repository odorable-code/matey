import React, { useEffect, useMemo, useState } from 'react';
import MyPagePanel from '../components/MyPagePanel';

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on', 'enabled'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', 'disabled'].includes(normalized)) return false;
  }
  if (typeof value === 'number') return value > 0;
  return fallback;
};

const buildInitialForm = (profile = {}) => {
  const settings = pickFirst(profile?.settings, profile?.preferences, profile?.profileSettings, {}) || {};

  return {
    nickname: pickFirst(
      profile?.nickname,
      profile?.name,
      profile?.displayName,
      profile?.userName,
      profile?.username,
      ''
    ),
    email: pickFirst(profile?.email, profile?.accountEmail, ''),
    phone: pickFirst(profile?.phone, profile?.phoneNumber, ''),
    bio: pickFirst(profile?.bio, profile?.introduction, profile?.description, ''),
    timezone: pickFirst(
      settings?.timezone,
      profile?.timezone,
      'Asia/Seoul'
    ),
    language: pickFirst(
      settings?.language,
      profile?.language,
      'ko'
    ),
    marketingConsent: toBoolean(
      pickFirst(
        settings?.marketingConsent,
        settings?.marketing,
        profile?.marketingConsent,
        false
      ),
      false
    ),
    emailNotification: toBoolean(
      pickFirst(
        settings?.emailNotification,
        settings?.emailNotifications,
        profile?.emailNotification,
        true
      ),
      true
    ),
    pushNotification: toBoolean(
      pickFirst(
        settings?.pushNotification,
        settings?.pushNotifications,
        profile?.pushNotification,
        true
      ),
      true
    ),
    reportAutoSave: toBoolean(
      pickFirst(
        settings?.reportAutoSave,
        settings?.autoSave,
        profile?.reportAutoSave,
        true
      ),
      true
    ),
    securityAlert: toBoolean(
      pickFirst(
        settings?.securityAlert,
        settings?.securityAlerts,
        profile?.securityAlert,
        true
      ),
      true
    ),
  };
};

function MyPageSettingsSection({
  profile = {},
  loading = false,
  errorMessage = '',
}) {
  const initialForm = useMemo(() => buildInitialForm(profile), [profile]);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const handleChange = (key) => (event) => {
    setSaved(false);
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const handleToggle = (key) => {
    setSaved(false);
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
   
    if (typeof onSaveProfile !== 'function') return;

    setIsSaving(true);
    setSaved(false);

    try {
      // 2. 백엔드(ProfileDTO) 구조에 맞게 데이터 가공
      const userPayload = {
        nickname: form.nickname,
        email: form.email,
        phone: form.phone,
        bio: form.bio,
      };
      const settingsPayload = {
          timezone: form.timezone,
          language: form.language,
          marketingConsent: form.marketingConsent,
          emailNotification: form.emailNotification,
          pushNotification: form.pushNotification,
          reportAutoSave: form.reportAutoSave,
          securityAlert: form.securityAlert,
      };
      await Promise.all(
        fetch('/api/mypage/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userPayload)
        }),
        fetch('/api/mypage/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingsPayload)
        })
      );
      setSaved(true);
    } catch (error) {
      alert('설정 저장에 실패했습니다. 다시 시도해주세요.'); // 에러 처리
    } finally {
      setIsSaving(false);
    } 
  };

  const profileSummary = useMemo(
    () => [
      {
        label: '닉네임',
        value: form.nickname || '미설정',
      },
      {
        label: '언어',
        value: form.language === 'en' ? 'English' : '한국어',
      },
      {
        label: '시간대',
        value: form.timezone || 'Asia/Seoul',
      },
      {
        label: '보안 알림',
        value: form.securityAlert ? '활성화' : '비활성화',
      },
    ],
    [form]
  );

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <MyPagePanel
        label="Settings"
        title="설정"
        description="프로필 정보와 알림, 보안 관련 설정을 편안하게 관리할 수 있어요."
      >
        {loading ? (
          <div className="matey-mypage__empty">설정 정보를 불러오는 중이에요.</div>
        ) : errorMessage ? (
          <div className="matey-mypage__empty">{errorMessage}</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
            }}
          >
            {profileSummary.map((item) => (
              <article key={item.label} className="matey-mypage__summary-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        )}
      </MyPagePanel>

      <MyPagePanel
        label="Profile"
        title="프로필 정보"
        description="기본 계정 정보와 상담 프로필 문구를 수정할 수 있어요."
        smallHead
      >
        <form className="matey-mypage__form" onSubmit={handleSubmit}>
          <div className="matey-mypage__form-grid">
            <label className="matey-mypage__field">
              <span>닉네임</span>
              <input
                type="text"
                value={form.nickname}
                onChange={handleChange('nickname')}
                placeholder="닉네임을 입력하세요"
              />
            </label>

            <label className="matey-mypage__field">
              <span>이메일</span>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="example@matey.ai"
              />
            </label>

            <label className="matey-mypage__field">
              <span>연락처</span>
              <input
                type="text"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="010-0000-0000"
              />
            </label>

            <label className="matey-mypage__field">
              <span>언어</span>
              <select value={form.language} onChange={handleChange('language')}>
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </label>

            <label className="matey-mypage__field matey-mypage__field--full">
              <span>한 줄 소개</span>
              <textarea
                value={form.bio}
                onChange={handleChange('bio')}
                placeholder="상담 목표나 현재 상황을 간단히 적어두면 좋아요."
              />
            </label>

            <label className="matey-mypage__field">
              <span>시간대</span>
              <select value={form.timezone} onChange={handleChange('timezone')}>
                <option value="Asia/Seoul">Asia/Seoul</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </label>

            <div className="matey-mypage__field matey-mypage__field--readonly">
              <span>계정 상태</span>
              <div className="matey-mypage__readonly-box">
                {pickFirst(profile?.status, profile?.accountStatus, '정상 이용 중')}
              </div>
            </div>
          </div>

          <div className="matey-mypage__panel-actions">
            <button type="submit" className="matey-mypage__primary-button" disabled={isSaving}>
              {isSaving ? '저장 중...' : '설정 저장' }
            </button>
            {saved ? <p className="matey-mypage__success-text">변경사항이 반영되었어요.</p> : null}
          </div>
        </form>
      </MyPagePanel>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 24,
        }}
      >
        <MyPagePanel
          label="Notifications"
          title="알림 설정"
          description="상담 리마인드와 리포트 알림 방식을 조절할 수 있어요."
          smallHead
        >
          <div className="matey-mypage__settings-group">
            <article className="matey-mypage__setting-card">
              <div>
                <strong>이메일 알림</strong>
                <p>상담 요약, 리포트 안내, 주요 계정 변경 사항을 이메일로 받아요.</p>
              </div>
              <button
                type="button"
                className={`matey-mypage__toggle ${form.emailNotification ? 'is-on' : ''}`}
                onClick={() => handleToggle('emailNotification')}
                aria-pressed={form.emailNotification}
                aria-label="이메일 알림 토글"
              >
                <span />
              </button>
            </article>

            <article className="matey-mypage__setting-card">
              <div>
                <strong>푸시 알림</strong>
                <p>상담 시작 전 알림과 일정한 감정 체크 리마인드를 받을 수 있어요.</p>
              </div>
              <button
                type="button"
                className={`matey-mypage__toggle ${form.pushNotification ? 'is-on' : ''}`}
                onClick={() => handleToggle('pushNotification')}
                aria-pressed={form.pushNotification}
                aria-label="푸시 알림 토글"
              >
                <span />
              </button>
            </article>

            <article className="matey-mypage__setting-card">
              <div>
                <strong>마케팅 수신 동의</strong>
                <p>새로운 프로그램, 이벤트, 추천 기능 업데이트를 받아볼 수 있어요.</p>
              </div>
              <button
                type="button"
                className={`matey-mypage__toggle ${form.marketingConsent ? 'is-on' : ''}`}
                onClick={() => handleToggle('marketingConsent')}
                aria-pressed={form.marketingConsent}
                aria-label="마케팅 알림 토글"
              >
                <span />
              </button>
            </article>
          </div>
        </MyPagePanel>

        <MyPagePanel
          label="Privacy"
          title="보안 및 데이터"
          description="상담 데이터 저장 방식과 보안 관련 옵션을 관리할 수 있어요."
          smallHead
        >
          <div className="matey-mypage__settings-group">
            <article className="matey-mypage__setting-card">
              <div>
                <strong>리포트 자동 저장</strong>
                <p>상담 이후 생성된 감정 리포트를 자동으로 보관해 다음 분석에 활용해요.</p>
              </div>
              <button
                type="button"
                className={`matey-mypage__toggle ${form.reportAutoSave ? 'is-on' : ''}`}
                onClick={() => handleToggle('reportAutoSave')}
                aria-pressed={form.reportAutoSave}
                aria-label="리포트 자동 저장 토글"
              >
                <span />
              </button>
            </article>

            <article className="matey-mypage__setting-card">
              <div>
                <strong>보안 알림</strong>
                <p>로그인 이상 감지나 계정 변경 발생 시 즉시 알림을 받아요.</p>
              </div>
              <button
                type="button"
                className={`matey-mypage__toggle ${form.securityAlert ? 'is-on' : ''}`}
                onClick={() => handleToggle('securityAlert')}
                aria-pressed={form.securityAlert}
                aria-label="보안 알림 토글"
              >
                <span />
              </button>
            </article>
          </div>

          <div className="matey-mypage__security-box">
            <strong
              style={{
                display: 'block',
                marginBottom: 10,
                color: 'var(--matey-mypage-title)',
                fontSize: 18,
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
              }}
            >
              계정 보호 안내
            </strong>

            <p
              style={{
                margin: 0,
                color: 'var(--matey-mypage-text-soft)',
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              비밀번호 변경이나 새로운 기기 로그인, 결제 정보 수정이 발생하면 보안 알림을 통해
              빠르게 확인할 수 있어요. 상담 기록은 민감 정보일 수 있으니 공용 기기에서는 사용 후
              로그아웃하는 것을 권장해요.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                marginTop: 16,
              }}
            >
              <article className="matey-mypage__summary-item">
                <span>최근 로그인</span>
                <strong>{pickFirst(profile?.lastLoginAt, profile?.lastLogin, '기록 없음')}</strong>
              </article>

              <article className="matey-mypage__summary-item">
                <span>보안 상태</span>
                <strong>{form.securityAlert ? '모니터링 활성화' : '기본 모드'}</strong>
              </article>
            </div>
          </div>
        </MyPagePanel>
      </div>
    </div>
  );
}

export default React.memo(MyPageSettingsSection);
