package kr.hi.matey.dto;
import lombok.Data;

@Data
public class UserSettingsDTO {
    private boolean pushNotice;         // USER_SETTING.bot_letter_enabled
    private boolean satisfactionPopup;  // USER_SETTING.satisfaction_popup_enabled
    private boolean marketingNotice;    // USER.is_marketing_agreed

    // 상세 알림 설정 (USER_NOTIFICATION_SETTING)
    private boolean noti_BOT_MESSAGE;
    private boolean noti_CHAT_REMINDER;
    private boolean noti_COMMENT_REPLY;
    private boolean noti_COMMUNITY_HOT;
    private boolean noti_EVENT_NOTICE;
    private boolean noti_POINT_REWARD;
    private boolean noti_POST_COMMENT;
    private boolean noti_REPORT_RESULT;
    private boolean noti_SUPPORT_ANSWER;
    private boolean noti_SYSTEM_NOTICE;
}