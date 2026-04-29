package kr.hi.matey.dto;
import lombok.Data;

@Data
public class SettingUpdateDTO {
    private String settingKey; // pushNotice, satisfactionPopup, marketingNotice
    private boolean settingValue;
}