import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, checkEmailDuplicate, checkNickNameDuplicate } from '../../utils/api';
import './AuthPage.css';

const LOGIN_INITIAL = {
  email: '',
  password: '',
  rememberMe: false,
};

const SIGNUP_INITIAL = {
  userName: '',
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  termsAgreed: false,    // 이용약관(필수)
  privacyAgreed: false,  // 개인정보(필수)
  marketingAgreed: false // 마케팅(선택)
};

const TAB_COPY = {
  login: {
    badge: 'Matey account',
    eyebrow: 'Welcome back',
    title: '다시 이어서',
    accent: '시작해요',
    description:
      '저장된 대화 흐름과 감정 기록, 메이트 설정을 그대로 이어서 편하게 돌아올 수 있어요.',
    helper: '이전 대화와 리듬을 바로 복원해서 다시 시작할 수 있어요.',
    miniLabel: 'Today with Matey',
    miniTitle: '오늘도 차분하게 이어지는 로그인',
  },
  signup: {
    badge: 'Start with Matey',
    eyebrow: 'Create account',
    title: '처음이어도',
    accent: '어렵지 않아요',
    description:
      '몇 가지 정보만 입력하면 바로 시작할 수 있어요. 복잡하지 않게, 필요한 단계만 남겨두었어요.',
    helper: '가입 직후 바로 로그인해서 웹과 데스크톱 흐름을 자연스럽게 연결할 수 있어요.',
    miniLabel: 'Easy onboarding',
    miniTitle: '가볍게 시작하는 회원가입',
  },
};

function getPasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: '입력 전',
      message: '영문과 숫자를 포함해 8자 이상으로 설정해 주세요.',
    };
  }

  let score = 0;

  // 비번이 8자 이상일 때
  if (password.length >= 8) score += 1;
  // 영어 대소문자 1글자 이상 포함
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score += 1;
  // 숫자 1글자 이상 포함, 비번이 10자 이상일 때
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 10) score += 1;

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

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // {a : {isAuthenticated : b}}로 되어있다면
  // XX!! const { a.isAuthenticated } = useAuth(); 처럼 점(.)을 찍는 문법은 자바스크립트에서 허용되지 않는 문법
  // const { login, signup, socialLogin, a: { isAuthenticated } } = useAuth();
  // 또는
  // const { login, signup } = auth;  const { isAuthenticated } = auth.a; 로 꺼내쓸 수 있다.
  const { login, signup, socialLogin, isAuthenticated } = useAuth();

  const activeTab = location.pathname === '/signup' ? 'signup' : 'login';
  const currentCopy = TAB_COPY[activeTab];

  const [loginForm, setLoginForm] = useState(LOGIN_INITIAL);
  const [signupForm, setSignupForm] = useState(SIGNUP_INITIAL);

  const [loginErrors, setLoginErrors] = useState({});
  const [signupErrors, setSignupErrors] = useState({});

  const [submitMessage, setSubmitMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(signupForm.password),
    [signupForm.password]
  );

  // 회원가입을 마치고 로그인 창으로 넘어왔을 때 이메일 입력칸에 방금 가입한 이메일이 타이핑 되어 있는 상태가 됨 => 비번만 입력하면 되서 편함
  useEffect(() => {
    if (location.state?.signupEmail) {
      setLoginForm((prev) => ({
        ...prev,
        email: location.state.signupEmail,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated) {
      const rawFrom = location.state?.from;
      const from =
        typeof rawFrom === 'string' && rawFrom.startsWith('/') ? rawFrom : '/';

      // replace : flase, 기본값 : false는 이동할 때 브라우저 방문 기록에 새로운 페이지를 추가(뒤로가기 하면 이전 페이지가 나옴)
      // replace : true : 현재 페이지 기록을 새로운 페이지로 덮어씀(뒤로가기 해도 이전 페이지 안 나옴)
      // replace : true는 언제 쓸까? 로그인 성공 했는데 뒤로 가기를 눌러서 다시 로그인 폼이 나오면 안될 때 
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  const goToTab = (tab) => {
    setSubmitMessage('');

    if (tab === 'login') {
      navigate('/login');
    } else {
      navigate('/signup');
    }
  };

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setLoginErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleSignupChange = (event) => {
    const { name, value, type, checked } = event.target;

    setSignupForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setSignupErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const validateLoginForm = () => {
    const nextErrors = {};

    if (!loginForm.email.trim()) {
      nextErrors.email = '이메일을 입력해 주세요.';
    } else if (!validateEmail(loginForm.email)) {
      nextErrors.email = '올바른 이메일 형식으로 입력해 주세요.';
    }

    if (!loginForm.password) {
      nextErrors.password = '비밀번호를 입력해 주세요.';
    }

    return nextErrors;
  };

  const validateSignupForm = () => {
    const nextErrors = {};

    if (!signupForm.userName.trim()) {
      nextErrors.userName = ' 이름을 입력해 주세요.';
    }
    if (!signupForm.nickname.trim()) {
      nextErrors.nickname = '닉네임을 입력해 주세요.';
    } else if (signupForm.nickname.trim().length < 2) {
      nextErrors.nickname = '닉네임은 2자 이상이어야 해요.';
    } else if (/\s/.test(signupForm.nickname)) {
      nextErrors.nickname = '닉네임에 공백을 포함할 수 없어요.';
    }

    if (!signupForm.email.trim()) {
      nextErrors.email = '이메일을 입력해 주세요.';
    } else if (!validateEmail(signupForm.email)) {
      nextErrors.email = '올바른 이메일 형식으로 입력해 주세요.';
    }

    if (!signupForm.password) {
      nextErrors.password = '비밀번호를 입력해 주세요.';
    } else if (signupForm.password.length < 8) {
      nextErrors.password = '비밀번호는 8자 이상이어야 해요.';
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(signupForm.password)) {
      nextErrors.password = '영문과 숫자를 함께 포함해 주세요.';
    }

    if (!signupForm.confirmPassword) {
      nextErrors.confirmPassword = '비밀번호 확인을 입력해 주세요.';
    } else if (signupForm.password !== signupForm.confirmPassword) {
      nextErrors.confirmPassword = '비밀번호가 서로 다르게 입력되었어요.';
    }

    if (!signupForm.termsAgreed || !signupForm.privacyAgreed) {
    nextErrors.agree = '서비스 이용을 위해 필수 약관 동의가 필요해요.';
  }

    return nextErrors;
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateLoginForm();
    setLoginErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      setSubmitMessage('');

      await login({
        email: loginForm.email.trim(),
        password: loginForm.password,
        rememberMe : loginForm.rememberMe
      });

      const rawFrom = location.state?.from;
      const from =
        typeof rawFrom === 'string' && rawFrom.startsWith('/') ? rawFrom : '/';
      navigate(from, { replace: true });
    } catch (error) {
      setSubmitMessage(error.message || '로그인에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  // console.log("signupForm:", signupForm);

  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateSignupForm();
    setSignupErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      setSubmitMessage('');

      const isNicknameDuplicate = await checkNickNameDuplicate(signupForm.nickname.trim());

      if (isNicknameDuplicate) {
        setSignupErrors(prev => ({
          ...prev,
          nickname: '이미 사용 중인 닉네임이에요.'
        }));
        setLoading(false);
        return;
      }
      else {
      // [Case 2] 중복이 아닌 경우 (사용 가능)
      setSignupErrors(prev => ({
        ...prev,
        nickname: '' // 기존 에러 메시지 제거
      }));
      setLoading(false);
    }

      const isEmailDuplicate = await checkEmailDuplicate(signupForm.email.trim());
      
      if (isEmailDuplicate) {
        setSignupErrors(prev => ({
          ...prev,
          email: '이미 사용 중인 이메일이에요.'
        }));
        setLoading(false);
        return;
      }
      else {
      // [Case 2] 중복이 아닌 경우 (사용 가능)
      setSignupErrors(prev => ({
        ...prev,
        email: '' // 기존 에러 메시지 제거
      }));
      setLoading(false);
    }
      const result = await signup({
        userName: signupForm.userName.trim(),
        nickname: signupForm.nickname.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
        termsAgreed: signupForm.termsAgreed,
        privacyAgreed: signupForm.privacyAgreed,
        marketingAgreed: signupForm.marketingAgreed
      });

      if (result?.accessToken) {
        navigate('/', { replace: true });
        return;
      }

      navigate('/login', {
        replace: true,
        state: {
          signupEmail: signupForm.email.trim(),
          signupSuccess: true,
        },
      });
    } catch (error) {
      setSubmitMessage(error.message || '회원가입에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    try {
      socialLogin(provider);
    } catch (error) {
      setSubmitMessage(error.message || '소셜 로그인 연결에 실패했어요.');
    }
  };

  return (
    <main className="matey-auth-page">
      <section className="matey-auth-layout">
        <aside className="matey-auth-side">
          <span className="matey-auth-side__badge">{currentCopy.badge}</span>

          <p className="matey-auth-side__eyebrow">{currentCopy.eyebrow}</p>

          <h1 className="matey-auth-side__title">
            {currentCopy.title}
            <br />
            <span>{currentCopy.accent}</span>
          </h1>

          <p className="matey-auth-side__description">{currentCopy.description}</p>

          <div className="matey-auth-side__compact-card">
            <div className="matey-auth-side__bubble">
              {activeTab === 'login'
                ? '다시 돌아온 지금, 메이티가 이전 흐름을 부드럽게 이어줄게요.'
                : '처음 시작하는 순간도 부담 없게, 필요한 단계만 천천히 도와드릴게요.'}
            </div>

            <div className="matey-auth-side__image-wrap">
              <img
                src="/images/rabbit-duo.png"
                alt="Matey characters"
                className="matey-auth-side__image"
              />
            </div>

            <div className="matey-auth-side__mini">
              <span className="matey-auth-side__mini-label">{currentCopy.miniLabel}</span>
              <strong>{currentCopy.miniTitle}</strong>
              <p>{currentCopy.helper}</p>
            </div>
          </div>
        </aside>

        <section className="matey-auth-main">
          <div className="matey-auth-card">
            <div className="matey-auth-card__top">
              <div className="matey-auth-card__title-wrap">
                <p className="matey-auth-card__eyebrow">
                  {activeTab === 'login' ? 'Account login' : 'Create your account'}
                </p>
                <h2 className="matey-auth-card__title">
                  {activeTab === 'login' ? '로그인' : '회원가입'}
                </h2>
              </div>

              <div className="matey-auth-tabs" role="tablist" aria-label="인증 탭">
                <button
                  type="button"
                  className={`matey-auth-tabs__button ${activeTab === 'login' ? 'is-active' : ''}`}
                  onClick={() => goToTab('login')}
                >
                  로그인
                </button>
                <button
                  type="button"
                  className={`matey-auth-tabs__button ${activeTab === 'signup' ? 'is-active' : ''}`}
                  onClick={() => goToTab('signup')}
                >
                  회원가입
                </button>
              </div>
            </div>

            {location.state?.signupSuccess && activeTab === 'login' && (
              <div className="matey-auth-alert matey-auth-alert--success">
                회원가입이 완료됐어요. 로그인해서 바로 시작해보세요.
              </div>
            )}

            {submitMessage && (
              <div className="matey-auth-alert matey-auth-alert--error">
                {submitMessage}
              </div>
            )}

            {activeTab === 'login' ? (
              <form className="matey-auth-form" onSubmit={handleLoginSubmit}>
                <div className="matey-auth-field">
                  <label htmlFor="login-email" className="matey-auth-field__label">
                    이메일
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    className={`matey-auth-field__input ${loginErrors.email ? 'has-error' : ''}`}
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                  />
                  {loginErrors.email && (
                    <p className="matey-auth-field__error">{loginErrors.email}</p>
                  )}
                </div>

                <div className="matey-auth-field">
                  <label htmlFor="login-password" className="matey-auth-field__label">
                    비밀번호
                  </label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    className={`matey-auth-field__input ${loginErrors.password ? 'has-error' : ''}`}
                    placeholder="비밀번호를 입력해 주세요"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                  />
                  {loginErrors.password && (
                    <p className="matey-auth-field__error">{loginErrors.password}</p>
                  )}
                </div>

                <div className="matey-auth-row">
                  <label className="matey-auth-check">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={loginForm.rememberMe}
                      onChange={handleLoginChange}
                    />
                    <span>로그인 상태 유지</span>
                  </label>

                  <Link to="/forgot-id" className="matey-auth-link">
                    아이디 찾기
                  </Link>

                  <Link to="/forgot-password" className="matey-auth-link">
                    비밀번호 재설정
                  </Link>
                </div>

                <button type="submit" className="matey-auth-submit" disabled={loading}>
                  {loading ? '로그인 중...' : '로그인하기'}
                </button>

                <div className="matey-auth-divider">
                  <span>또는</span>
                </div>

                <div className="matey-auth-socials">
                  <button
                    type="button"
                    className="matey-auth-social matey-auth-social--kakao"
                    onClick={() => handleSocialLogin('kakao')}
                  >
                    <span className="matey-auth-social__icon">K</span>
                    <span>Kakao로 계속하기</span>
                  </button>

                  <button
                    type="button"
                    className="matey-auth-social matey-auth-social--naver"
                    onClick={() => handleSocialLogin('naver')}
                  >
                    <span className="matey-auth-social__icon">N</span>
                    <span>Naver로 계속하기</span>
                  </button>
                </div>
              </form>
            ) : (
              <form className="matey-auth-form" onSubmit={handleSignupSubmit}>
              <div className="matey-auth-field">
                  <label htmlFor="signup-nickname" className="matey-auth-field__label">
                    이름
                  </label>
                  <input
                    id="signup-nickname"
                    name="userName"
                    type="text"
                    className={`matey-auth-field__input ${signupErrors.userName ? 'has-error' : ''}`}
                    placeholder="이름을 입력해주세요."
                    value={signupForm.userName}
                    onChange={handleSignupChange}
                  />
                  {signupErrors.userName && (
                    <p className="matey-auth-field__error">{signupErrors.userName}</p>
                  )}
                </div>
                <div className="matey-auth-field">
                  <label htmlFor="signup-nickname" className="matey-auth-field__label">
                    닉네임
                  </label>
                  <input
                    id="signup-nickname"
                    name="nickname"
                    type="text"
                    className={`matey-auth-field__input ${signupErrors.nickname ? 'has-error' : ''}`}
                    placeholder="2자 이상 닉네임"
                    value={signupForm.nickname}
                    onChange={handleSignupChange}
                  />
                  {signupErrors.nickname && (
                    <p className="matey-auth-field__error">{signupErrors.nickname}</p>
                  )}
                </div>

                <div className="matey-auth-field">
                  <label htmlFor="signup-email" className="matey-auth-field__label">
                    이메일
                  </label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    className={`matey-auth-field__input ${signupErrors.email ? 'has-error' : ''}`}
                    placeholder="you@example.com"
                    value={signupForm.email}
                    onChange={handleSignupChange}
                  />
                  {signupErrors.email && (
                    <p className="matey-auth-field__error">{signupErrors.email}</p>
                  )}
                </div>

                <div className="matey-auth-field">
                  <label htmlFor="signup-password" className="matey-auth-field__label">
                    비밀번호
                  </label>
                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    className={`matey-auth-field__input ${signupErrors.password ? 'has-error' : ''}`}
                    placeholder="영문/숫자 포함 8자 이상"
                    value={signupForm.password}
                    onChange={handleSignupChange}
                  />

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

                  {signupErrors.password && (
                    <p className="matey-auth-field__error">{signupErrors.password}</p>
                  )}
                </div>

                <div className="matey-auth-field">
                  <label htmlFor="signup-confirm-password" className="matey-auth-field__label">
                    비밀번호 확인
                  </label>
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    className={`matey-auth-field__input ${
                      signupErrors.confirmPassword ? 'has-error' : ''
                    }`}
                    placeholder="비밀번호를 한 번 더 입력해 주세요"
                    value={signupForm.confirmPassword}
                    onChange={handleSignupChange}
                  />
                  {signupErrors.confirmPassword && (
                    <p className="matey-auth-field__error">
                      {signupErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <label className="matey-auth-check matey-auth-check--full">
                  <input
                    type="checkbox"
                    name="termsAgreed"
                    checked={signupForm.termsAgreed}
                    onChange={handleSignupChange}
                  />
                  <span>(필수)서비스 이용약관에 동의합니다.</span>
                </label>

                <label className="matey-auth-check matey-auth-check--full">
                  <input
                    type="checkbox"
                    name="privacyAgreed"
                    checked={signupForm.privacyAgreed}
                    onChange={handleSignupChange}
                  />
                  <span>(필수)개인정보 처리에 동의합니다.</span>
                </label>

                <label className="matey-auth-check matey-auth-check--full">
                  <input
                    type="checkbox"
                    name="marketingAgreed"
                    checked={signupForm.marketingAgreed}
                    onChange={handleSignupChange}
                  />
                  <span>(선택)마케팅 목적 이용에 동의합니다.</span>
                </label>

                {signupErrors.agree && (
                  <p className="matey-auth-field__error">{signupErrors.agree}</p>
                )}

                <button type="submit" className="matey-auth-submit" disabled={loading}>
                  {loading ? '가입 처리 중...' : '회원가입하기'}
                </button>
              </form>
            )}

            <div className="matey-auth-footer-links">
              <Link to="/">홈으로 돌아가기</Link>
              <Link to="/download">다운로드 페이지 보기</Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
