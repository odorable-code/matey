import React, { useEffect, useState } from 'react';
import styles from './ProfileCard.module.css';
import { myPageAPI } from '../../utils/api';

const DEFAULT_PROFILE_IMAGE = '/images/mypage/bot/matey-profile.png';

function ProfileCard() {
  const [profileData, setProfileData] = useState({
    greeting: '반가워요',
    nickname: '성호',
    email: 'sungho@example.com',
    profileImage: DEFAULT_PROFILE_IMAGE,
  });

  useEffect(() => {
    myPageAPI.getProfile().then(data => {
      setProfileData({
        greeting: data.greeting || '',
        nickname: data.nickname || '',
        email: data.email || '',
        profileImage: data.profileImage || DEFAULT_PROFILE_IMAGE,
      });
    }).catch(console.error);
  }, []);

  const handleImageError = (event) => {
    event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
  };

  return (
    <article className={styles.card}>
      <div className={styles.avatarSection}>
        <div className={styles.avatarWrap}>
          <img
            src={profileData.profileImage || DEFAULT_PROFILE_IMAGE}
            alt="프로필 이미지"
            className={styles.avatarImage}
            onError={handleImageError}
          />
        </div>
      </div>

      <div className={styles.meta}>
        <span className={styles.greeting}>{profileData.greeting}</span>
        <strong className={styles.nickname}>{profileData.nickname}</strong>
        <span className={styles.email}>{profileData.email}</span>
      </div>
    </article>
  );
}

export default ProfileCard;
