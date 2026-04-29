package kr.hi.matey.dto;
import lombok.Data;

@Data
public class UserProfileDTO {
    private Long userId;
    private String nickname;
    private String name;
    private String email;
    private String birthDate;
    private String gender;
    private String joinedAt;
    private String profileImage;
}
