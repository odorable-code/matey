package kr.hi.matey.dto;
import lombok.Data;

@Data
public class UserSettingsDTO {
    private boolean pushNotice;
    private boolean emailNotice;
    private boolean gentleTone; // DB 확장 필요
    private boolean quickReply; // DB 확장 필요
}
