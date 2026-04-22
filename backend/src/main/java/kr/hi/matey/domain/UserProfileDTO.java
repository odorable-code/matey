package kr.hi.matey.domain;

import lombok.Data;

@Data
public class UserProfileDTO {
    private String id;
    private String nickname;
    private String email;
    private String phone;
    private String bio;
    private String status;           // "정상 이용 중"
    private String subscriptionName; // "Premium Care"
    private Long points;
    private Integer totalSessions;
    private String lastLoginAt;
}