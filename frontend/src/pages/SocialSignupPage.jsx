import React, { useState, useEffect } from 'react';
import { API_BASE_URL, setStoredToken } from 'utils/api';

/**
 * 소셜 최초 로그인 시 백엔드 세션(PENDING_SOCIAL_USER)과 함께 추가 정보 제출
 */
export default function SocialSignupPage() {
  const [userEmail, setUserEmail] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailCheckMsg, setEmailCheckMsg] = useState('');
  const [userName, setUserName] = useState('');
  const [userBirth, setUserBirth] = useState('');
  const [gender, setGender] = useState('1');
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(false);
  const [isMarketingAgreed, setIsMarketingAgreed] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/auth/social/prefill`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : {})
      .then((data) => {
        if (data.email) {
          setUserEmail(data.email);
          setEmailChecked(true);
          setEmailCheckMsg('');
        }
        if (data.nickname) setUserName(data.nickname);
        if (data.birthdate) setUserBirth(data.birthdate);
        if (data.gender === 'M') setGender('1');
        else if (data.gender === 'F') setGender('2');
      })
      .catch(() => {});
  }, []);

  const handleEmailCheck = async () => {
    const email = userEmail.trim();
    if (!email) {
      setEmailCheckMsg('이메일을 입력해 주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailCheckMsg('올바른 이메일 형식을 입력해 주세요.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.isEmailDuplicate) {
        setEmailChecked(false);
        setEmailCheckMsg('이미 사용 중인 이메일입니다.');
      } else {
        setEmailChecked(true);
        setEmailCheckMsg('사용 가능한 이메일입니다.');
      }
    } catch {
      setEmailCheckMsg('중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!userEmail.trim()) {
      setMessage('이메일을 입력해 주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
      setMessage('올바른 이메일 형식을 입력해 주세요.');
      return;
    }
    if (!emailChecked) {
      setMessage('이메일 중복 확인을 해주세요.');
      return;
    }
    if (!userName.trim()) {
      setMessage('이름을 입력해 주세요.');
      return;
    }
    if (!userBirth) {
      setMessage('생년월일을 선택해 주세요.');
      return;
    }
    if (!isTermsAgreed || !isPrivacyAgreed) {
      setMessage('필수 약관에 동의해 주세요.');
      return;
    }

    const birthMs = new Date(userBirth).getTime();
    if (Number.isNaN(birthMs)) {
      setMessage('생년월일이 올바르지 않아요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/social/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: userEmail.trim(),
          userName: userName.trim(),
          userBirth: birthMs,
          gender: Number(gender),
          isAdult: true,
          isNotiAgree: false,
          isTermsAgreed: isTermsAgreed ? 1 : 0,
          isPrivacyAgreed: isPrivacyAgreed ? 1 : 0,
          isMarketingAgreed: isMarketingAgreed ? 1 : 0,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || '회원가입 요청에 실패했어요.');
      }

      if (data.token) {
        setStoredToken(data.token);
        window.location.replace(`${window.location.origin}/mypage`);
      } else {
        throw new Error('토큰을 받지 못했어요.');
      }
    } catch (err) {
      setMessage(err.message || '소셜 회원가입에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '100px 1rem 3rem' }}>
      <h1 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>소셜 계정 추가 정보</h1>
      <p style={{ color: '#6f6883', fontSize: 14, marginBottom: '1.5rem' }}>
        최초 소셜 로그인입니다. 서비스 이용을 위해 아래 정보를 입력해 주세요.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>이메일</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => { setUserEmail(e.target.value); setEmailChecked(false); setEmailCheckMsg(''); }}
              placeholder="example@email.com"
              style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc' }}
            />
            <button
              type="button"
              onClick={handleEmailCheck}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #5c4b8a',
                background: '#fff',
                color: '#5c4b8a',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              중복 확인
            </button>
          </div>
          {emailCheckMsg && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: emailChecked ? '#27ae60' : '#c0392b' }}>
              {emailCheckMsg}
            </p>
          )}
        </div>

        <label style={{ display: 'block', marginBottom: '0.75rem' }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>이름</span>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '0.75rem' }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>생년월일</span>
          <input
            type="date"
            value={userBirth}
            onChange={(e) => setUserBirth(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '1rem' }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>성별</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc' }}
          >
            <option value="1">남성</option>
            <option value="2">여성</option>
          </select>
        </label>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={isTermsAgreed}
            onChange={(e) => setIsTermsAgreed(e.target.checked)}
          />
          <span>(필수) 이용약관 동의</span>
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={isPrivacyAgreed}
            onChange={(e) => setIsPrivacyAgreed(e.target.checked)}
          />
          <span>(필수) 개인정보 처리방침 동의</span>
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1.25rem' }}>
          <input
            type="checkbox"
            checked={isMarketingAgreed}
            onChange={(e) => setIsMarketingAgreed(e.target.checked)}
          />
          <span>(선택) 마케팅 수신 동의</span>
        </label>

        {message ? (
          <p style={{ color: '#c0392b', fontSize: 14, marginBottom: 12 }}>{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: 'none',
            background: '#5c4b8a',
            color: '#fff',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? '처리 중...' : '가입 완료'}
        </button>
      </form>
    </main>
  );
}
