package kr.hi.matey.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {

	@Schema(description = "사용자 고유 번호 (PK)")
    private int userNum;
    @Schema(description = "사용자의 아이디")
    String userId;
    @Schema(description = "사용자의 비밀번호")
    String userPw;
    @Schema(description = "사용자의 이름")
    String userName;
    @Schema(description = "사용자의 주소")
    String userAddr;
    @Schema(description = "사용자의 이메일")
    String userEmail;
    @Schema(description = "사용자의 전화번호")
    String userPhone;
    @Schema(description = "사용자의 생년월일")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    LocalDate userBirth;
    @Schema(description = "사용자의 성별")
    String userGender;
    @Schema(description = "알림 허용 여부")
    boolean userAlert;
    @Schema(description = "서비스이용약관 동의 여부")
    boolean isTermsAgreed;
    @Schema(description = "개인정보처리방침동의여부")
    boolean isPrivacyAgreed;
    @Schema(description = "마케팅정보수신 동의 여부")
    boolean isMarketingAgreed;
    @Schema(description = "역할")
    String role;
}
