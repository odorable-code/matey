import React, { useState } from "react";
import ProfileCard from "./ProfileCard";
import SideMenu from "./SideMenu";
import MyPageLayout from "./layout/MyPageLayout";
import DashboardContent from "./contents/DashboardContent";
import EmotionReportContent from "./contents/EmotionReportContent";
import AttendanceFeedContent from "./contents/AttendanceFeedContent";
import LetterBoxContent from "./contents/LetterBoxContent";
import SettingsContent from "./contents/SettingsContent";

// TODO: API 연동
const dummyUser = {
  nickname: "성호",
  email: "sungho@example.com",
  profileImage: "/images/avatar-default.png",
  loginType: "LOCAL",
};

// TODO: API 연동
const dummyInventory = {
  universalFeedCount: 12,
};

// TODO: API 연동
const dummyIntimacy = {
  score: 340,
  level: 3,
  nextLevelScore: 500,
};

// TODO: API 연동
const dummyRecentChat = {
  title: "오늘의 마음 산책",
  preview: "오늘 하루는 어땠어? 편하게 이야기해도 괜찮아.",
};

// TODO: API 연동
const dummyWeeklyEmotion = {
  name: "편안함",
  summary: "지난주보다 좋아졌어요",
};

function MyPageContainer() {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <DashboardContent
            recentChat={dummyRecentChat}
            weeklyEmotion={dummyWeeklyEmotion}
            intimacy={dummyIntimacy}
            inventory={dummyInventory}
          />
        );

      case "emotionReport":
        return <EmotionReportContent />;

      case "attendance":
        return <AttendanceFeedContent />;

      case "letterBox":
        return <LetterBoxContent />;

      case "settings":
        return <SettingsContent />;

      default:
        return (
          <DashboardContent
            recentChat={dummyRecentChat}
            weeklyEmotion={dummyWeeklyEmotion}
            intimacy={dummyIntimacy}
            inventory={dummyInventory}
          />
        );
    }
  };

  return (
    <MyPageLayout
      sidebar={
        <>
          <ProfileCard user={dummyUser} />
          <SideMenu activeMenu={activeMenu} onMenuClick={setActiveMenu} />
        </>
      }
      content={renderContent()}
    />
  );
}

export default MyPageContainer;
