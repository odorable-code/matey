package kr.hi.matey.dto;
import lombok.Data;

@Data
public class UserSettingsDTO {
    private boolean pushNotice;         // USER_SETTING.bot_letter_enabled
    private boolean emailNotice;        // USER_SETTING.email_notice_enabled
    private boolean gentleTone;         // USER_SETTING.gentle_tone_enabled
    private boolean quickReply;         // USER_SETTING.quick_reply_enabled
    private boolean satisfactionPopup;  // USER_SETTING.satisfaction_popup_enabled
    private boolean marketingNotice;    // USER.is_marketing_agreed
}