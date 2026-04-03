import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function DashboardSidebar({ isAdmin }) {
  const location = useLocation();
  const navigate = useNavigate();

  const mainMenuItems = [
    { icon: '🏠', label: '대시보드', path: '/dashboard' },
    { icon: '💬', label: '대화 내역', path: '/dashboard/chat-history' },
    { icon: '🔒', label: '보안 설정', path: '/dashboard/security' },
    { icon: '📊', label: '리포트', path: '/dashboard/reports' },
    { icon: '👤', label: '개인정보 관리', path: '/dashboard/personal-info' },
    { icon: '⚙️', label: '개인 설정', path: '/dashboard/settings' },
  ];

  const adminMenuItems = [
    { icon: '👥', label: '사용자 관리', path: '/admin' },
    { icon: '📈', label: '통계', path: '/admin/stats' },
    { icon: '⚙️', label: '시스템 설정', path: '/admin/system' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">메뉴</div>
        <div className="sidebar-menu">
          {mainMenuItems.map(item => (
            <button
              key={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="sidebar-section">
          <div className="sidebar-title">관리자</div>
          <div className="sidebar-menu">
            {adminMenuItems.map(item => (
              <button
                key={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-title">계정</div>
        <div className="sidebar-menu">
          <button
            className={`sidebar-item ${isActive('/mypage') ? 'active' : ''}`}
            onClick={() => navigate('/mypage')}
          >
            <span className="sidebar-icon">🧑‍💼</span>
            <span>내 정보</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
