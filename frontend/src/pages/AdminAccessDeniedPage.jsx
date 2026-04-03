// src/pages/AdminAccessDeniedPage.jsx
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminAccessDeniedPage.css';

function AdminAccessDeniedPage() {
  const { isAuthenticated, authLoading, user } = useAuth();

  if (authLoading) {
    return (
      <main className="matey-admin-denied matey-admin-denied--loading">
        <div className="matey-admin-denied__card">
          <div className="matey-admin-denied__spinner" />
          <h1>권한을 확인하고 있어요</h1>
          <p>잠시만 기다려 주세요.</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user?.role || user?.roles?.[0] || '').toUpperCase();
  const isAdmin = role === 'ADMIN' || role.includes('ADMIN');

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main className="matey-admin-denied">
      <section className="matey-admin-denied__card">
        <span className="matey-admin-denied__badge">403 ACCESS DENIED</span>

        <div className="matey-admin-denied__icon-wrap">
          <div className="matey-admin-denied__icon">!</div>
        </div>

        <h1>관리자 전용 페이지예요</h1>
        <p>
          현재 로그인한 계정은 관리자 권한이 없어서 관리자 대시보드에 접근할 수
          없어요. 필요한 기능은 마이페이지에서 계속 이용해 주세요.
        </p>

        <div className="matey-admin-denied__info">
          <div className="matey-admin-denied__info-item">
            <span>현재 계정</span>
            <strong>{user?.nickname || user?.email || '일반 사용자'}</strong>
          </div>
          <div className="matey-admin-denied__info-item">
            <span>권한</span>
            <strong>{role || 'USER'}</strong>
          </div>
        </div>

        <div className="matey-admin-denied__actions">
          <Link to="/mypage" className="matey-admin-denied__primary">
            마이페이지로 이동
          </Link>
          <Link to="/" className="matey-admin-denied__secondary">
            홈으로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}

export default AdminAccessDeniedPage;
