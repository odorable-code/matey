package kr.hi.matey.dto;
import lombok.Data;

@Data
public class SettingUpdateDTO {
    private String settingKey; // pushNotice, emailNotice, gentleTone 등
    private boolean settingValue;
}