import React, { useLayoutEffect } from 'react';
import { setStoredToken } from 'utils/api';

/**
 * 백엔드 OAuth 성공 후 리다이렉트: /login/social-success?token=...
 * 토큰을 저장한 뒤 전체 새로고침으로 /mypage 진입 → AuthContext가 프로필 로드
 */
export default function SocialLoginSuccessPage() {
  useLayoutEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (token) {
      setStoredToken(token);
      window.location.replace(`${window.location.origin}/mypage`);
    } else {
      window.location.replace(`${window.location.origin}/login?error=oauth`);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: '40vh',
        display: 'grid',
        placeItems: 'center',
        color: '#6f6883',
        fontSize: '15px',
        fontWeight: 700,
      }}
    >
      로그인 처리 중이에요...
    </div>
  );
}
