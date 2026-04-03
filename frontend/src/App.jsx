// src/App.jsx
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/3_Layout/MainLayout';
import MainPage from './pages/HomePage';
import DownloadPage from './pages/DownloadPage';
import AuthPage from './components/5_Auth/AuthPage';
import ForgotPasswordPage from './components/5_Auth/ForgotPasswordPage';
import MyPage from './components/7_MyPage/MyPage';
import AdminPage from './components/8_AdminPage/AdminPage';
import AdminAccessDeniedPage from './pages/AdminAccessDeniedPage';

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

function AdminRoute({ children }) {
  const { isAuthenticated, authLoading, user } = useAuth();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user?.role || user?.roles?.[0] || '').toUpperCase();
  const isAdmin = role === 'ADMIN' || role.includes('ADMIN');

  if (!isAdmin) {
    return <Navigate to="/admin-access-denied" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/mypage" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/download" element={<DownloadPage />} />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <AuthPage />
            </PublicOnlyRoute>
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
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
