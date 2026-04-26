package kr.hi.matey.dto;
import lombok.Data;

@Data
public class UserProfileDTO {
    private String userId; // DB의 user_id (또는 별도 로그인 ID)
    private String nickname;
    private String name; // DB user_name
    private String email;
    private String phone; // DB에 추가 필요 (현재 스키마에 없음)
    private String birthDate;
    private String gender;
    private String joinedAt; // created_at 포맷팅
    private String profileImage;
}