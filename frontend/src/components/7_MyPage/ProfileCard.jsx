import React from 'react';
import styles from './ProfileCard.module.css';

const profileData = {
  // TODO: API 연동 - 실제 사용자 프로필 데이터로 교체
  greeting: '반가워요',
  nickname: '성호',
  email: 'sungho@example.com',
  profileImage: '/images/rabbit-profile.png',
};

function ProfileCard() {
  return (
    <article className={styles.card}>
      <div className={styles.avatarSection}>
        <div className={styles.avatarWrap}>
          <img
            src={profileData.profileImage}
            alt="프로필 이미지"
            className={styles.avatarImage}
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
