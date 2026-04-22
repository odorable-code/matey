package kr.hi.matey.domain;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class AdminsDTO {
    int adminNum;
    String adminId;
    String adminPw;
    String adminName;
    String adminAddr;
    String adminEmail;
    String adminPhone;
    String businessNum;
    boolean adminTermsAgreed;
    boolean adminLocationAgreed;
    boolean adminAlert;
    LocalDateTime adminCreatedAt;
    LocalDateTime adminUpdatedAt;

    public static record LoginDTO (
        @Schema(description = "사용자의 아이디")
        String userId,
        @Schema(description = "사용자의 암호")
        String userPw,

        //AdminLogin-서연
        @Schema(description = "로그인 상태 유지 여부")
        boolean keepLogin
    ) {}
}
