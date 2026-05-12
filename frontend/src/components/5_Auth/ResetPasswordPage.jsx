import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { forgotPassword, validateEmail, resetPassword } from '../../utils/api';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [submitState, setSubmitState] = useState({
    loading: false,
    success: '',
    error: '',
  });

  function getPasswordStrength(newPassword) {
  if (!newPassword) {
    return {
      score: 0,
      label: '입력 전',
      message: '영문과 숫자를 포함해 8자 이상으로 설정해 주세요.',
    };
  }

  let score = 0;

  // 비번이 8자 이상일 때
  if (newPassword.length >= 8) score += 1;
  // 영어 대소문자 1글자 이상 포함
  if (/[A-Za-z]/.test(newPassword) && /\d/.test(newPassword)) score += 1;
  // 숫자 1글자 이상 포함, 비번이 10자 이상일 때
  if (/[^A-Za-z0-9]/.test(newPassword) || newPassword.length >= 10) score += 1;

  if (score <= 1) {
    return {
      score,
      label: '약함',
      message: '영문과 숫자를 함께 넣고 조금 더 길게 설정해 보세요.',
    };
  }

  if (score === 2) {
    return {
      score,
      label: '보통',
      message: '좋아요. 특수문자를 넣으면 더 안전해져요.',
    };
  }

  return {
    score,
    label: '강함',
    message: '충분히 안전한 비밀번호예요.',
  };
}

const passwordStrength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword]
  );

  const clearMessages = () => {
    if (submitState.success || submitState.error) {
      setSubmitState({
        loading: false,
        success: '',
        error: '',
      });
    }
  };

  const token = searchParams.get('token');

  const handleSubmit = async (event) => {
    event.preventDefault();

    // 파라미터에 토큰이 없는 경우
    if (!token) {
      setSubmitState({
        loading: false,
        success: '',
        error: '유효하지 않은 접근입니다. 메일의 링크를 다시 확인해주세요.',
      });
      return;
    }

    const trimmedPassword = newPassword.trim();

    if (!trimmedPassword) {
      setSubmitState({
        loading: false,
        success: '',
        error: ' 비밀번호를 입력해 주세요.',
      });
      return;
    }

    const nextErrors = {};
    if (!newPassword) {
      nextErrors.newPassword = '비밀번호를 입력해 주세요.';
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = '비밀번호는 8자 이상이어야 해요.';
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      nextErrors.newPassword = '영문과 숫자를 함께 포함해 주세요.';
    }

    if (Object.keys(nextErrors).length > 0){
      setErrors(nextErrors);
      return;
    }

    // 에러가 없으면 기존 에러 초기화
    setErrors({});

    try {
      setSubmitState({
        loading: true,
        success: '',
        error: '',
      });

      const result = await resetPassword(token, trimmedPassword);

      setSubmitState({
        loading: false,
        success:
          result.raw?.message,
        error: '',
      });

      // 성공 시 2초 뒤 로그인 페이지로 이동하는 등의 처리
      setTimeout(() => navigate('/login'), 2500);

    } catch (error) {
      setSubmitState({
        loading: false,
        success: '',
        error: error.message || '비밀번호 재설정에 실패했어요.',
      });
    }
  };

  return (
    <main className="matey-forgot-page">
      <section className="matey-forgot-layout">
        <aside className="matey-forgot-side">
          <span className="matey-forgot-side__badge">Password recovery</span>

          <p className="matey-forgot-side__eyebrow">Need help?</p>

          <h1 className="matey-forgot-side__title">
            비밀번호를
            <br />
            <span>차분하게 다시 찾을게요</span>
          </h1>

          <p className="matey-forgot-side__description">
            가입한 이메일 주소를 입력하면 비밀번호를 재설정할 수 있는 링크를
            보내드릴게요. 복잡한 설명 없이, 필요한 단계만 간단하게 준비했어요.
          </p>

          <div className="matey-forgot-side__card">
            <div className="matey-forgot-side__bubble">
              로그인 정보가 헷갈려도 괜찮아요. 가입한 이메일만 알고 있으면
              다시 시작할 수 있어요.
            </div>

            <div className="matey-forgot-side__image-wrap">
              <img
                src="/images/mypage/bot/matey-base.png"
                alt="메이티 캐릭터"
                className="matey-forgot-side__image"
              />
            </div>

            <div className="matey-forgot-side__mini">
              <span className="matey-forgot-side__mini-label">Quick guide</span>
              <strong>이렇게 진행돼요</strong>
              <ul className="matey-forgot-side__steps">
                <li>가입한 이메일 주소 입력</li>
                <li>재설정 링크 메일 수신</li>
                <li>새 비밀번호 설정 후 다시 로그인</li>
              </ul>
            </div>
          </div>
        </aside>

        <section className="matey-forgot-main">
          <div className="matey-forgot-card">
            <div className="matey-forgot-card__top">
              <div className="matey-forgot-card__title-wrap">
                <p className="matey-forgot-card__eyebrow">Reset your password</p>
                <h2 className="matey-forgot-card__title">비밀번호를 재설정해주세요.</h2>
              </div>

              <div className="matey-forgot-card__status">
                <span className="matey-forgot-card__status-dot" />
                이메일 인증 방식
              </div>
            </div>

            {submitState.success && (
              <div className="matey-forgot-alert matey-forgot-alert--success">
                {submitState.success}
              </div>
            )}

            {submitState.error && (
              <div className="matey-forgot-alert matey-forgot-alert--error">
                {submitState.error}
              </div>
            )}

            <form className="matey-forgot-form" onSubmit={handleSubmit}>
              <div className="matey-forgot-field">
                <label
                  htmlFor="forgot-password-email"
                  className="matey-forgot-field__label"
                >
                  재설정할 비번을 입력해주세요.
                </label>

                <input
                  id="forgot-password-email"
                  className="matey-forgot-field__input"
                  placeholder=""
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    clearMessages();
                  }}
                />
                {errors.newPassword && (
                    <p className="matey-auth-field__error">{errors.newPassword}</p>
                  )}
              </div>

              <div className="matey-auth-strength">
                    <div className="matey-auth-strength__track">
                      <div
                        className={`matey-auth-strength__fill score-${passwordStrength.score}`}
                        style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                      />
                    </div>
                    <div className="matey-auth-strength__meta">
                      <strong>{passwordStrength.label}</strong>
                      <span>{passwordStrength.message}</span>
                    </div>
                  </div>

              <button
                type="submit"
                className="matey-forgot-submit"
                disabled={submitState.loading}
              >
                {submitState.loading ? '보내는 중...' : '비밀번호 변경하기'}
              </button>
            </form>

            <div className="matey-forgot-footer-links">
              <Link to="/login">로그인으로 돌아가기</Link>
              <Link to="/signup">새 계정 만들기</Link>
              <Link to="/">홈으로 돌아가기</Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
