import React from "react";
import styles from "./ProfileCard.module.css";

// TODO: API 연동
const dummyUser = {
  nickname: "성호",
  email: "sungho@example.com",
  profileImage: "/images/avatar-default.png",
  loginType: "LOCAL",
};

function ProfileCard({ user = dummyUser }) {
  return (
    <div className={styles.card}>
      <div className={styles.avatarArea}>
        <div className={styles.avatarFrame}>
          <img
            src={user.profileImage}
            alt={`${user.nickname} 프로필`}
            className={styles.avatarImage}
          />
        </div>

        <img
          src="/images/badge-meity.png"
          alt="메이티 배지"
          className={styles.badgeImage}
        />
      </div>

      <h2 className={styles.nickname}>{user.nickname}</h2>
    </div>
  );
}

export default ProfileCard;
