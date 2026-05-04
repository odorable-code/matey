import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { myPageAPI } from '../../utils/api';
import styles from '../7_MyPage/layout/ProfileCard.module.css';

const DEFAULT_PROFILE_IMAGE = '/images/mypage/bot/matey-profile.png';

function CommunityProfileCard() {
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    myPageAPI
      .getProfile()
      .then((data) => {
        if (!cancelled && data) {
          setProfile({
            nickname: data.nickname || user?.nickname || user?.name || '회원',
            greeting: data.greeting || '반가워요',
            email: data.email || user?.email || '',
            profileImage: data.profileImage || DEFAULT_PROFILE_IMAGE,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile({
            nickname: user?.nickname || user?.name || user?.email?.split('@')?.[0] || '회원',
            greeting: '반가워요',
            email: user?.email || '',
            profileImage: DEFAULT_PROFILE_IMAGE,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const handleImageError = (event) => {
    event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
  };

  if (!isAuthenticated) {
    return (
      <article className={styles.card}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrap}>
            <img
              src={DEFAULT_PROFILE_IMAGE}
              alt=""
              className={styles.avatarImage}
              onError={handleImageError}
            />
          </div>
        </div>
        <div className={styles.meta}>
          <Link to="/login" className={styles.nickname} style={{ textDecoration: 'none' }}>
            로그인하기
          </Link>
          <span className={styles.greeting} style={{ marginTop: 4 }}>
            내 닉네임과 멘트가 여기에 보여요
          </span>
        </div>
      </article>
    );
  }

  const p = profile || {
    nickname: user?.nickname || user?.name || user?.email?.split('@')?.[0] || '회원',
    greeting: '반가워요',
    email: user?.email || '',
    profileImage: DEFAULT_PROFILE_IMAGE,
  };

  return (
    <article className={styles.card}>
      <div className={styles.avatarSection}>
        <div className={styles.avatarWrap}>
          <img
            src={p.profileImage || DEFAULT_PROFILE_IMAGE}
            alt="프로필"
            className={styles.avatarImage}
            onError={handleImageError}
          />
        </div>
      </div>
      <div className={styles.meta}>
        <span className={styles.greeting}>{p.greeting}</span>
        <strong className={styles.nickname}>{p.nickname}</strong>
        {p.email ? <span className={styles.email}>{p.email}</span> : null}
      </div>
    </article>
  );
}

export default CommunityProfileCard;
