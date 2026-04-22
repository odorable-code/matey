package kr.hi.matey.domain;

import lombok.Data;

@Data
public class UserVO {
    private int userNum;
    private String userId;              // 사용자아이디
    private String userPw;              // 사용자비밀번호
    private String userName;            // 사용자이름
    private String userAddr;            // 사용자주소
    private String userEmail;           // 사용자이메일
    private String userPhone;           // 사용자전화번호
    private String userBirth;           // 사용자생년월일
    private String userCreatedAt;      // 사용자가입일자
    private String userUpdatedAt;      // 사용자마지막정보수정일시
    private String userGender;          // 사용자성별 (varchar(1))
    private boolean userAlert;          // 알림허용여부
    private boolean termsAgreed;        // 서비스이용약관동의여부
    private boolean locationAgreed;     // 위치깁반 서비스 동의여부
    private String role;                 // 역할
}
