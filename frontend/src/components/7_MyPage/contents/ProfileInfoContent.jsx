import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfileInfoContent.module.css';
import { myPageAPI } from '../../../utils/api';

const DEFAULT_PROFILE_IMAGE = '/images/mypage/bot/matey-profile.png';

const initialProfile = {
  userId: '',
  nickname: '',
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  gender: '선택 안 함',
  joinedAt: '',
  profileImage: DEFAULT_PROFILE_IMAGE,
};

function ProfileInfoContent() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    myPageAPI.getProfile().then(data => {
      const fetched = {
        userId: data.userId || '',
        nickname: data.nickname || '',
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        birthDate: data.birthDate || '',
        gender: data.gender || '선택 안 함',
        joinedAt: data.joinedAt || '',
        profileImage: data.profileImage || DEFAULT_PROFILE_IMAGE,
      };
      setProfile(fetched);
      setDraft(fetched);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    return () => {
      if (draft.profileImage?.startsWith('blob:')) {
        URL.revokeObjectURL(draft.profileImage);
      }
    };
  }, [draft.profileImage]);

  const currentProfile = isEditMode ? draft : profile;

  const handleStartEdit = () => {
    setDraft({ ...profile });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (
      draft.profileImage?.startsWith('blob:') &&
      draft.profileImage !== profile.profileImage
    ) {
      URL.revokeObjectURL(draft.profileImage);
    }

    setDraft({ ...profile });
    setIsEditMode(false);
  };

  const handleSaveEdit = () => {
    myPageAPI.updateProfile({
      nickname: draft.nickname,
      phone: draft.phone,
      gender: draft.gender,
      profileImage: draft.profileImage
    }).then(() => {
      setProfile({ ...draft });
      setIsEditMode(false);
    }).catch(console.error);
  };

  const handleEditableChange = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpenFilePicker = () => {
    if (!isEditMode) return;
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const previewUrl = URL.createObjectURL(selectedFile);

    if (draft.profileImage?.startsWith('blob:')) {
      URL.revokeObjectURL(draft.profileImage);
    }

    setDraft((prev) => ({
      ...prev,
      profileImage: previewUrl,
    }));
  };

  const handleImageError = (event) => {
    event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
  };

  return (
    <section className={styles.page}>
      <div className={styles.headerRow} data-reveal-skip="true">
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>PROFILE INFO</span>
          <h2 className={styles.title}>개인정보</h2>
          <p className={styles.description}>
            수정 가능한 항목은 닉네임, 이메일, 프로필 사진, 휴대폰 번호, 성별만
            남기고 나머지는 읽기 전용으로 정리했어요.
          </p>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <article className={styles.avatarCard}>
          <div className={styles.avatarTop}>
            <div className={styles.avatarFrame}>
              <img
                src={currentProfile.profileImage || DEFAULT_PROFILE_IMAGE}
                alt="프로필 이미지"
                className={styles.avatarImage}
                onError={handleImageError}
              />
            </div>

            <div className={styles.avatarMeta}>
              <strong className={styles.avatarName}>
                {currentProfile.nickname}
              </strong>
              <span className={styles.avatarId}>{profile.email}</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handleProfileImageChange}
          />

          <button
            type="button"
            className={styles.imageButton}
            onClick={handleOpenFilePicker}
            disabled={!isEditMode}
          >
            프로필 사진 변경
          </button>

          <p className={styles.avatarHint}>
            {isEditMode
              ? '수정 모드에서만 프로필 사진을 변경할 수 있어요.'
              : '사진 변경은 수정 버튼을 누른 후 가능합니다.'}
          </p>
        </article>

        <article className={styles.formCard}>
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionTitle}>기본 정보</h3>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>이메일</span>
                <input
                  type="email"
                  value={currentProfile.email}
                  disabled
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>닉네임</span>
                <input
                  type="text"
                  value={currentProfile.nickname}
                  disabled={!isEditMode}
                  onChange={(e) => handleEditableChange('nickname', e.target.value)}
                  className={styles.input}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>이름</span>
                <input
                  type="text"
                  value={currentProfile.name}
                  disabled
                  className={`${styles.input} ${styles.readOnly}`}
                />
              </label>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>비밀번호</span>
                <button
                  type="button"
                  className={styles.passwordButton}
                  onClick={() => navigate('/forgot-password')}
                >
                  비밀번호 변경하기
                </button>
              </div>


            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionTitle}>추가 정보</h3>
            </div>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>가입일</span>
                <input
                  type="text"
                  value={currentProfile.joinedAt}
                  disabled
                  className={`${styles.input} ${styles.readOnly}`}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>성별</span>
                <select
                  value={currentProfile.gender}
                  disabled={!isEditMode}
                  onChange={(e) => handleEditableChange('gender', e.target.value)}
                  className={styles.select}
                >
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                  <option value="선택 안 함">선택 안 함</option>
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>생년월일</span>
                <input
                  type="text"
                  value={currentProfile.birthDate}
                  disabled
                  className={`${styles.input} ${styles.readOnly}`}
                />
              </label>
            </div>
          </div>

          <div className={styles.formActions}>
            {!isEditMode ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleStartEdit}
              >
                수정
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleCancelEdit}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleSaveEdit}
                >
                  저장
                </button>
              </>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default ProfileInfoContent;
