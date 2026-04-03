import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, validateEmail } from '../../utils/api';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState({
    loading: false,
    success: '',
    error: '',
  });

  const clearMessages = () => {
    if (submitState.success || submitState.error) {
      setSubmitState({
        loading: false,
        success: '',
        error: '',
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setSubmitState({
        loading: false,
        success: '',
        error: '이메일을 입력해 주세요.',
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setSubmitState({
        loading: false,
        success: '',
        error: '올바른 이메일 형식으로 입력해 주세요.',
      });
      return;
    }

    try {
      setSubmitState({
        loading: true,
        success: '',
        error: '',
      });

      const result = await forgotPassword(trimmedEmail);

      setSubmitState({
        loading: false,
        success:
          result?.message ||
          '비밀번호 재설정 링크를 이메일로 보냈어요. 메일함을 확인해 주세요.',
        error: '',
      });
    } catch (error) {
      setSubmitState({
        loading: false,
        success: '',
        error: error.message || '비밀번호 재설정 요청에 실패했어요.',
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
                src="/images/rabbit-duo.png"
                alt="Matey characters"
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
                <h2 className="matey-forgot-card__title">재설정 링크 받기</h2>
              </div>

              <div className="matey-forgot-card__status">
                <span className="matey-forgot-card__status-dot" />
                이메일 인증 방식
              </div>
            </div>

            <p className="matey-forgot-card__description">
              계정에 연결된 이메일로 비밀번호 변경 안내를 보내드릴게요.
            </p>

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
                  이메일
                </label>

                <input
                  id="forgot-password-email"
                  type="email"
                  className="matey-forgot-field__input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearMessages();
                  }}
                />
              </div>

              <button
                type="submit"
                className="matey-forgot-submit"
                disabled={submitState.loading}
              >
                {submitState.loading ? '보내는 중...' : '재설정 링크 보내기'}
              </button>
            </form>

            <div className="matey-forgot-help">
              <div className="matey-forgot-help__item">
                <strong>메일이 안 보이나요?</strong>
                <p>스팸함, 프로모션함, 광고함도 함께 확인해 주세요.</p>
              </div>

              <div className="matey-forgot-help__item">
                <strong>계정이 기억나지 않나요?</strong>
                <p>자주 사용하는 이메일 주소부터 하나씩 확인해 보세요.</p>
              </div>
            </div>

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
