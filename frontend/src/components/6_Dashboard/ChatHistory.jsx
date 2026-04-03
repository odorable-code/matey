import React, { useState } from 'react';

function ChatHistory() {
  const [chats] = useState([
    {
      id: 1,
      date: '2024-04-02',
      time: '14:30',
      character: '하루',
      topic: '스트레스 관리',
      messages: 12,
      emoji: '😊',
    },
    {
      id: 2,
      date: '2024-04-01',
      time: '10:15',
      character: '루미',
      topic: '감정 표현',
      messages: 18,
      emoji: '😔',
    },
    {
      id: 3,
      date: '2024-03-31',
      time: '19:45',
      character: '하루',
      topic: '일상의 고민',
      messages: 25,
      emoji: '😟',
    },
    {
      id: 4,
      date: '2024-03-30',
      time: '15:20',
      character: '루미',
      topic: '자신감 회복',
      messages: 14,
      emoji: '💪',
    },
  ]);

  return (
    <div className="dashboard-section">
      <h2 className="section-title">대화 내역</h2>
      <p className="section-subtitle">최근 상담 기록을 확인하세요</p>

      <div className="chat-history-list">
        {chats.map((chat) => (
          <div key={chat.id} className="chat-history-item">
            <div className="chat-emoji">{chat.emoji}</div>
            <div className="chat-info">
              <div className="chat-header">
                <span className="chat-topic">{chat.topic}</span>
                <span className="chat-character">🤖 {chat.character}</span>
              </div>
              <div className="chat-meta">
                <span>{chat.date} {chat.time}</span>
                <span>💬 {chat.messages}개 메시지</span>
              </div>
            </div>
            <button className="chat-view-btn">보기</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatHistory;
