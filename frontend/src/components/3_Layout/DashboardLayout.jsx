import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from '../1_Header/Header';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '../../hooks/useAuth';
import './Layout.css';

function DashboardLayout() {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-container">
        <DashboardSidebar isAdmin={isAdmin} />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
