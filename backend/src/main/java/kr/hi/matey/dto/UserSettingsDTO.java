package kr.hi.matey.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class UserSettingsDTO {
    private boolean pushNotice;         // USER_SETTING.bot_letter_enabled
    private boolean satisfactionPopup;  // USER_SETTING.satisfaction_popup_enabled
    private boolean marketingNotice;    // USER.is_marketing_agreed
    private boolean casualTone;         // USER_SETTING.casual_mode_enabled

    // 상세 알림 설정 (USER_NOTIFICATION_SETTING)
    @JsonProperty("noti_BOT_MESSAGE")
    private boolean notiBotMessage;

    @JsonProperty("noti_CHAT_REMINDER")
    private boolean notiChatReminder;

    @JsonProperty("noti_COMMENT_REPLY")
    private boolean notiCommentReply;

    @JsonProperty("noti_COMMUNITY_HOT")
    private boolean notiCommunityHot;

    @JsonProperty("noti_EVENT_NOTICE")
    private boolean notiEventNotice;

    @JsonProperty("noti_POINT_REWARD")
    private boolean notiPointReward;

    @JsonProperty("noti_POST_COMMENT")
    private boolean notiPostComment;

    @JsonProperty("noti_REPORT_RESULT")
    private boolean notiReportResult;

    @JsonProperty("noti_SUPPORT_ANSWER")
    private boolean notiSupportAnswer;

    @JsonProperty("noti_SYSTEM_NOTICE")
    private boolean notiSystemNotice;
}