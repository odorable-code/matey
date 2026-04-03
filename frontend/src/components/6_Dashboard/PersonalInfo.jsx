import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

function PersonalInfo() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '010-1234-5678',
    birthDate: '1990-01-01',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    alert('정보가 저장되었습니다.');
  };

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title">개인정보 관리</h2>
        <button
          className={`edit-btn ${isEditing ? 'cancel' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? '취소' : '수정'}
        </button>
      </div>

      <div className="personal-info-form">
        <div className="form-group">
          <label>이름</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label>이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label>연락처</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label>생년월일</label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>

        {isEditing && (
          <button className="save-btn" onClick={handleSave}>
            저장하기
          </button>
        )}
      </div>

      <div className="account-info">
        <h3>계정 정보</h3>
        <div className="info-item">
          <span>가입일</span>
          <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
        </div>
        <div className="info-item">
          <span>선택한 캐릭터</span>
          <span>{user?.character === '루미' ? '🐱 루미' : '🐰 하루'}</span>
        </div>
        <div className="info-item">
          <span>계정 상태</span>
          <span className="status-active">✓ 활성</span>
        </div>
      </div>
    </div>
  );
}

export default PersonalInfo;
