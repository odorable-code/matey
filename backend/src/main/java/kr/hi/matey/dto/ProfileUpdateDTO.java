package kr.hi.matey.dto;
import lombok.Data;

@Data
public class ProfileUpdateDTO {
    private String nickname;
    private String phone;
    private String gender;
    private String profileImage;
}