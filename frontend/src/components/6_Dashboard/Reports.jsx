import React, { useState } from 'react';

function Reports() {
  const [reportType, setReportType] = useState('weekly');

  const emotionData = {
    happy: 35,
    sad: 20,
    anxious: 25,
    calm: 20,
  };

  const weeklyData = [
    { day: '월', emoji: '😊', count: 3 },
    { day: '화', emoji: '😔', count: 2 },
    { day: '수', emoji: '😟', count: 4 },
    { day: '목', emoji: '😊', count: 3 },
    { day: '금', emoji: '😊', count: 5 },
    { day: '토', emoji: '😊', count: 2 },
    { day: '일', emoji: '😔', count: 1 },
  ];

  return (
    <div className="dashboard-section">
      <h2 className="section-title">리포트</h2>
      <p className="section-subtitle">당신의 감정 변화를 분석합니다</p>

      <div className="report-tabs">
        <button
          className={`report-tab ${reportType === 'weekly' ? 'active' : ''}`}
          onClick={() => setReportType('weekly')}
        >
          주간 요약
        </button>
        <button
          className={`report-tab ${reportType === 'emotion' ? 'active' : ''}`}
          onClick={() => setReportType('emotion')}
        >
          감정 분석
        </button>
        <button
          className={`report-tab ${reportType === 'history' ? 'active' : ''}`}
          onClick={() => setReportType('history')}
        >
          고민 히스토리
        </button>
      </div>

      {reportType === 'weekly' && (
        <div className="report-content">
          <div className="weekly-chart">
            {weeklyData.map((data, idx) => (
              <div key={idx} className="chart-item">
                <div className="chart-bar" style={{ height: `${data.count * 15}%` }}>
                  <span className="chart-emoji">{data.emoji}</span>
                </div>
                <span className="chart-label">{data.day}</span>
              </div>
            ))}
          </div>
          <p className="chart-subtitle">이번 주는 총 20개의 상담을 진행했습니다</p>
        </div>
      )}

      {reportType === 'emotion' && (
        <div className="report-content">
          <div className="emotion-grid">
            {Object.entries(emotionData).map(([emotion, percent]) => (
              <div key={emotion} className="emotion-card">
                <div className="emotion-circle" style={{ width: `${percent * 1.5}px`, height: `${percent * 1.5}px` }}>
                  {emotion === 'happy' && '😊'}
                  {emotion === 'sad' && '😔'}
                  {emotion === 'anxious' && '😟'}
                  {emotion === 'calm' && '😌'}
                </div>
                <span className="emotion-label">
                  {emotion === 'happy' && '행복'}
                  {emotion === 'sad' && '슬픔'}
                  {emotion === 'anxious' && '불안'}
                  {emotion === 'calm' && '침착'}
                </span>
                <span className="emotion-percent">{percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportType === 'history' && (
        <div className="report-content">
          <div className="history-list">
            <div className="history-item">
              <span className="history-date">2024-04-02</span>
              <span className="history-topic">스트레스 관리</span>
              <span className="history-progress">50% 개선</span>
            </div>
            <div className="history-item">
              <span className="history-date">2024-04-01</span>
              <span className="history-topic">감정 표현</span>
              <span className="history-progress">35% 개선</span>
            </div>
            <div className="history-item">
              <span className="history-date">2024-03-31</span>
              <span className="history-topic">일상의 고민</span>
              <span className="history-progress">40% 개선</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
