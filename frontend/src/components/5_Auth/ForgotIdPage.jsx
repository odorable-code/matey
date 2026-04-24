import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotId, validateEmail } from '../../utils/api';
import './ForgotIdPage.css';

export default function ForgotIdPage() {
  const [name, setName] = useState('');
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

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setSubmitState({
        loading: false,
        success: '',
        error: '이름을 입력해 주세요.',
      });
      return;
    }

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

      const result = await forgotId(trimmedName, trimmedEmail);
      setSubmitState({
        loading: false,
        success:
          result.raw?.message ? `찾으시는 아이디는 [${result.raw.message}] 입니다.` : result.message,
        error: '',
      });
    } catch (error) {
      setSubmitState({
        loading: false,
        success: '',
        error: error.message || '입력하신 정보와 일치하는 아이디를 찾지 못했어요.',
      });
    }
  };

  return (
    <main className="matey-forgot-page">
      <section className="matey-forgot-layout">
        <aside className="matey-forgot-side">
          <span className="matey-forgot-side__badge">Id recovery</span>

          <p className="matey-forgot-side__eyebrow">Need help?</p>

          <h1 className="matey-forgot-side__title">
            아이디를
            <br />
            <span>차분하게 다시 찾을게요</span>
          </h1>

          <p className="matey-forgot-side__description">
            가입한 이름과 이메일을 입력하면 아이디를 찾을 수 있어요.
            필요한 단계만 간단하게 준비했어요.
          </p>

          <div className="matey-forgot-side__card">
            <div className="matey-forgot-side__bubble">
              로그인 정보가 헷갈려도 괜찮아요. 가입한 이름과 닉네임만 알고 있으면
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
                <li>가입한 이름과 이메일 주소 입력</li>
                <li>찾은 아이디 확인</li>
                <li>아이디와 비밀번호로 다시 로그인</li>
              </ul>
            </div>
          </div>
        </aside>

        <section className="matey-forgot-main">
          <div className="matey-forgot-card">
            <div className="matey-forgot-card__top">
              <div className="matey-forgot-card__title-wrap">
                <p className="matey-forgot-card__eyebrow">Find your id</p>
                <h2 className="matey-forgot-card__title">아이디 찾기</h2>
              </div>

              <div className="matey-forgot-card__status">
                <span className="matey-forgot-card__status-dot" />
                이름/이메일 인증 방식
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
                  이름
                </label>

                <input
                  id="forgot-password-email"
                  type="email"
                  className="matey-forgot-field__input"
                  placeholder="이름을 입력해주세요."
                  value={name}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearMessages();
                  }}
                />
              </div>

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
                  placeholder="이메일을 입력해주세요."
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
                {submitState.loading ? '보내는 중...' : '아이디 찾기'}
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
