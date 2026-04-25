package kr.hi.matey.dto;

import lombok.Data;

@Data
public class UserProfileDTO {
    private String id;
    private String nickname;
    private String email;
    private String phone;
    private String bio;
    private String status;
    private String subscriptionName;
    private Long points;
    private Integer totalSessions;
    private String lastLoginAt;
}