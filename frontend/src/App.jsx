/**
 * =========================================================
 * 파일명 : src/App.jsx
 * 역할   : 프로젝트 전체 라우팅 + 전역 채팅 모달 마운트
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 로그인 여부에 따라 접근 가능한 페이지를 나눕니다.
 * - 공통 레이아웃(MainLayout) 안에서 페이지를 렌더링합니다.
 * - 보호 라우트 / 관리자 라우트 / 비회원 전용 라우트 관리.
 * - 헤더 메뉴 공개 페이지 라우트 연결.
 * - "채팅하기" 버튼용 전역 채팅 모달(ChatModal)을 한 번만 마운트.
 *
 * [이번 수정 핵심]
 * - ChatModalProvider 로 전체 앱을 감쌈
 *   → 어디서든 useChatModal() 훅으로 openChat / closeChat 호출 가능
 * - <ChatModal /> 을 라우트 바깥에 한 번만 마운트
 *   → 어느 페이지에서든 같은 모달이 떠오름
 *
 * [여기서 찾을 것]
 * 1) 로그인 필요한 페이지 보호      → ProtectedRoute
 * 2) 관리자 전용 페이지 보호        → AdminRoute
 * 3) 비회원만 접근 가능한 페이지   → PublicOnlyRoute
 * 4) 전체 페이지 주소 연결         → AppRoutes
 * 5) 임시 공개 소개 페이지         → TempInfoPage
 * 6) 임시 채팅 페이지              → TempChatPage
 * 7) 전역 채팅 모달 마운트         → App() 하단 <ChatModal />
 *
 * [나중에 실제 페이지로 교체하는 방법]
 * - /features, /free-trial, /community, /bot-ranking, /faq 는
 *   현재 임시 소개 페이지로 연결되어 있습니다.
 * - 나중에 실제 컴포넌트를 만들면 해당 route의 element만 교체하면 됩니다.
 * =========================================================
 */

import React, { useEffect } from 'react';
import { Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import MainLayout from './components/3_Layout/MainLayout';
import ScrollToTop from './components/ScrollToTop';
import AuthPage from './components/5_Auth/AuthPage';
import ForgotPasswordPage from './components/5_Auth/ForgotPasswordPage';
import ForgotIdPage from './components/5_Auth/ForgotIdPage';
import ResetPasswordPage from './components/5_Auth/ResetPasswordPage';

import MyPage from './components/7_MyPage/pages/MyPage';
import AdminPage from './components/8_AdminPage/AdminPage';

import MainPage from './pages/HomePage';
import HowToUsePage from './pages/HowToUsePage';
import FaqPage from './pages/FaqPage';
import BotRankingPage from './pages/BotRankingPage.jsx';
import AdminAccessDeniedPage from './pages/AdminAccessDeniedPage';
import SocialLoginSuccessPage from './pages/SocialLoginSuccessPage';
import SocialSignupPage from './pages/SocialSignupPage';
import { canAccessAdminPage } from './utils/adminAccess';

import { NotificationProvider } from './contexts/NotificationContext';

/* =========================================================
   ✅ 전역 채팅 모달 관련 import
   - ChatModalProvider : 전역 모달 컨트롤러
   - ChatModal         : 실제 모달 UI (라우트 밖에서 한 번만 마운트)
========================================================= */
import { ChatModalProvider } from './contexts/ChatModalContext';
import ChatModal from './components/15_ChatModal/ChatModal';

/* =========================================================
   로그인 상태 확인 중일 때 보여주는 화면
========================================================= */
import CommunityLayout from './components/12_Community/CommunityLayout';
import CommunityPostList from './components/12_Community/CommunityPostList';
import CommunityPostDetail from './components/12_Community/CommunityPostDetail';
import CommunityPostForm from './components/12_Community/CommunityPostForm';
import CommunityFaqView from './components/12_Community/CommunityFaqView';
import CommunityInquiryPage from './components/12_Community/CommunityInquiryPage';
import CommunityNoticesPage from './components/12_Community/CommunityNoticesPage';
import CommunityNoticeWritePage from './components/12_Community/CommunityNoticeWritePage';

function AuthLoadingScreen() {
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
      로그인 상태를 확인하고 있어요...
    </div>
  );
}

/* =========================================================
   공개 소개용 임시 페이지
   - 헤더 메뉴 연결 확인용
   - 나중에 실제 페이지 컴포넌트로 교체 가능
========================================================= */
function TempInfoPage({
  eyebrow,
  title,
  description,
  primaryText = '홈으로 이동',
  primaryTo = '/',
  secondaryText = '무료체험 시작',
  secondaryTo = '/signup',
}) {
  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'grid',
        placeItems: 'center',
        padding: '120px 20px 40px',
        background:
          'linear-gradient(180deg, #fdfaff 0%, #f7f9ff 48%, #fff8fc 100%)',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '820px',
          padding: '40px 30px',
          borderRadius: '30px',
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(123, 139, 176, 0.12)',
          boxShadow: '0 20px 40px rgba(120, 130, 170, 0.12)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '76px',
            height: '76px',
            margin: '0 auto 18px',
            borderRadius: '24px',
            display: 'grid',
            placeItems: 'center',
            background:
              'linear-gradient(135deg, #79b7ff 0%, #8d79ff 48%, #ff93b7 100%)',
            color: '#fff',
            fontSize: '30px',
            fontWeight: 900,
            boxShadow: '0 16px 28px rgba(128, 117, 241, 0.22)',
          }}
        >
          M
        </div>

        <p
          style={{
            margin: '0 0 8px',
            color: '#7a7391',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}
        >
          {eyebrow}
        </p>

        <h1
          style={{
            margin: '0 0 14px',
            fontSize: '32px',
            lineHeight: 1.25,
            fontWeight: 900,
            color: '#2f3550',
            wordBreak: 'keep-all',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: '0 auto 24px',
            maxWidth: '620px',
            color: '#626d86',
            fontSize: '16px',
            lineHeight: 1.7,
            fontWeight: 600,
            wordBreak: 'keep-all',
          }}
        >
          {description}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to={primaryTo}
            style={{
              minHeight: '48px',
              padding: '0 18px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 800,
              color: '#4b5873',
              background: '#fff',
              border: '1px solid rgba(123, 139, 176, 0.14)',
            }}
          >
            {primaryText}
          </Link>

          <Link
            to={secondaryTo}
            style={{
              minHeight: '48px',
              padding: '0 18px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 800,
              color: '#fff',
              background:
                'linear-gradient(135deg, #79b7ff 0%, #8d79ff 48%, #ff93b7 100%)',
              border: 'none',
              boxShadow: '0 16px 28px rgba(128, 117, 241, 0.22)',
            }}
          >
            {secondaryText}
          </Link>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   임시 채팅 페이지
   - 아직 실제 chat.jsx가 비어 있으므로 임시로 사용
   - 모달 방식 채팅으로 전환되면 이 페이지는 거의 안 쓰일 수 있어요
========================================================= */
function TempChatPage() {
  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'grid',
        placeItems: 'center',
        padding: '120px 20px 40px',
        background:
          'linear-gradient(180deg, #fdfaff 0%, #f7f9ff 48%, #fff8fc 100%)',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '760px',
          padding: '36px 28px',
          borderRadius: '28px',
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(123, 139, 176, 0.12)',
          boxShadow: '0 20px 40px rgba(120, 130, 170, 0.12)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            margin: '0 auto 18px',
            borderRadius: '22px',
            display: 'grid',
            placeItems: 'center',
            background:
              'linear-gradient(135deg, #79b7ff 0%, #8d79ff 48%, #ff93b7 100%)',
            color: '#fff',
            fontSize: '28px',
            fontWeight: 900,
            boxShadow: '0 16px 28px rgba(128, 117, 241, 0.22)',
          }}
        >
          M
        </div>

        <p
          style={{
            margin: '0 0 8px',
            color: '#7a7391',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}
        >
          TEMP CHAT PAGE
        </p>

        <h1
          style={{
            margin: '0 0 14px',
            fontSize: '32px',
            lineHeight: 1.25,
            fontWeight: 900,
            color: '#2f3550',
          }}
        >
          채팅 페이지는 지금
          <br />
          임시 화면으로 연결되어 있어요
        </h1>

        <p
          style={{
            margin: '0 auto 24px',
            maxWidth: '520px',
            color: '#626d86',
            fontSize: '16px',
            lineHeight: 1.7,
            fontWeight: 600,
          }}
        >
          헤더의 <strong>채팅하기</strong> 버튼은 모달 방식으로 전환되며
          이 라우트는 백업 용도예요.
          <br />
          나중에 풀스크린 채팅 화면이 필요하면 이 부분만 교체하면 됩니다.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/mypage"
            style={{
              minHeight: '48px',
              padding: '0 18px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 800,
              color: '#4b5873',
              background: '#fff',
              border: '1px solid rgba(123, 139, 176, 0.14)',
            }}
          >
            마이페이지로 이동
          </Link>

          <Link
            to="/"
            style={{
              minHeight: '48px',
              padding: '0 18px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 800,
              color: '#fff',
              background:
                'linear-gradient(135deg, #79b7ff 0%, #8d79ff 48%, #ff93b7 100%)',
              border: 'none',
              boxShadow: '0 16px 28px rgba(128, 117, 241, 0.22)',
            }}
          >
            홈으로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   로그인한 사용자만 접근 가능한 라우트
========================================================= */
function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =========================================================
   관리자만 접근 가능한 라우트
========================================================= */
function AdminRoute({ children }) {
  const { isAuthenticated, authLoading, user } = useAuth();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessAdminPage(user)) {
    return <Navigate to="/admin-access-denied" replace />;
  }

  return children;
}

/* =========================================================
   비회원만 접근 가능한 라우트
========================================================= */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, authLoading, user } = useAuth();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated && user) {
    return <Navigate to="/mypage" replace />;
  }

  return children;
}

/* =========================================================
   API 401(토큰 만료) 시 저장소는 api.js에서 비우고,
   여기서 React 인증 상태 정리 + 로그인 화면으로 안내
========================================================= */
function SessionExpiredBridge() {
  const navigate = useNavigate();
  const { clearAuth } = useAuth();

  useEffect(() => {
    const onExpired = () => {
      clearAuth();
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/signup') {
        navigate('/login', { replace: true, state: { sessionExpired: true } });
      }
    };
    window.addEventListener('matey:session-expired', onExpired);
    return () => window.removeEventListener('matey:session-expired', onExpired);
  }, [navigate, clearAuth]);

  return null;
}

/* =========================================================
   실제 페이지 주소 연결하는 부분
========================================================= */
function AppRoutes() {
  return (
    <>
      <SessionExpiredBridge />
      <Routes>
      <Route element={<MainLayout />}>
        {/* =====================================================
            메인 / 공개 페이지
        ===================================================== */}
        <Route path="/" element={<MainPage />} />

        <Route path="/community" element={<CommunityLayout />}>
          <Route index element={<CommunityPostList />} />
          <Route path="notices" element={<CommunityNoticesPage />} />
          <Route path="notices/write" element={<CommunityNoticeWritePage />} />
          <Route path="faq" element={<CommunityFaqView />} />
          <Route path="inquiry" element={<CommunityInquiryPage />} />
          <Route path="write" element={<CommunityPostForm />} />
          <Route path="posts/:postId/edit" element={<CommunityPostForm />} />
          <Route path="posts/:postId" element={<CommunityPostDetail />} />
        </Route>

        <Route
          path="/features"
          element={<HowToUsePage />}
        />

        <Route
          path="/free-trial"
          element={
            <TempInfoPage
              eyebrow="FREE TRIAL"
              title="무료체험 페이지를 곧 연결할게요"
              description="회원가입 유도, 무료체험 혜택, 시작 가이드, 빠른 진입 버튼을 중심으로 랜딩형 소개 페이지를 붙일 예정이에요."
            />
          }
        />

        <Route
          path="/community"
          element={
            <TempInfoPage
              eyebrow="COMMUNITY"
              title="커뮤니티 페이지를 준비하고 있어요"
              description="사용자 후기, 공감 글, 질문/답변, 인기 게시글, 참여 유도 영역을 포함한 커뮤니티 메인 화면으로 연결될 자리예요."
            />
          }
        />

        <Route
          path="/bot-ranking"
          element={<BotRankingPage />}
        />

        <Route
          path="/faq"
          element={<FaqPage />}
        />

        {/* =====================================================
            비회원 전용 페이지
        ===================================================== */}
        <Route
          path="/login"
          element={
            <AuthPage />
          }
        />

        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <AuthPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/forgot-id"
          element={
            <PublicOnlyRoute>
              <ForgotIdPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/login/social-success"
          element={<SocialLoginSuccessPage />}
        />

        <Route
          path="/signup/social"
          element={
            <PublicOnlyRoute>
              <SocialSignupPage />
            </PublicOnlyRoute>
          }
        />

        {/* =====================================================
            로그인 회원 전용 페이지
        ===================================================== */}
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <TempChatPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            관리자 전용 페이지
        ===================================================== */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin-access-denied"
          element={
            <ProtectedRoute>
              <AdminAccessDeniedPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            정의되지 않은 주소는 홈으로 이동
        ===================================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  );
}

/* =========================================================
   최상위 App
   - AuthProvider          : 인증 상태
   - ChatModalProvider     : 전역 채팅 모달 컨트롤러
   - <ChatModal />         : 모달 UI 한 번만 마운트 (라우트 밖)
========================================================= */
export default function App() {
  return (
    <AuthProvider>
      <ChatModalProvider>
        <NotificationProvider>
          <ScrollToTop />
          <AppRoutes />

          {/* 채팅 모달만 전역 마운트 */}
          <ChatModal />
        </NotificationProvider>
      </ChatModalProvider>
    </AuthProvider>
  );
}


