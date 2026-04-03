import React, { useState } from 'react';
import './Dashboard.css';
import ChatHistory from './ChatHistory';
import SecuritySettings from './SecuritySettings';
import Reports from './Reports';
import PersonalInfo from './PersonalInfo';
import PersonalSettings from './PersonalSettings';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('chatHistory');

  const tabs = [
    { id: 'chatHistory', label: '💬 대화 내역', icon: '💬' },
    { id: 'reports', label: '📊 리포트', icon: '📊' },
    { id: 'personalInfo', label: '👤 개인정보', icon: '👤' },
    { id: 'personalSettings', label: '⚙️ 개인 설정', icon: '⚙️' },
    { id: 'securitySettings', label: '🔒 보안 설정', icon: '🔒' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'chatHistory':
        return <ChatHistory />;
      case 'reports':
        return <Reports />;
      case 'personalInfo':
        return <PersonalInfo />;
      case 'personalSettings':
        return <PersonalSettings />;
      case 'securitySettings':
        return <SecuritySettings />;
      default:
        return <ChatHistory />;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <p>당신의 AI 상담 기록과 통계를 확인하세요</p>
      </div>

      <div className="dashboard-container">
        <div className="dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
