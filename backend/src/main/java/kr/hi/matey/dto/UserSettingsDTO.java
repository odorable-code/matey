package kr.hi.matey.dto;
import lombok.Data;

@Data
public class UserSettingsDTO {
    private boolean pushNotice;         // USER_SETTING.bot_letter_enabled
    private boolean satisfactionPopup;  // USER_SETTING.satisfaction_popup_enabled
    private boolean marketingNotice;    // USER.is_marketing_agreed
}