package kr.hi.matey.dto;

import lombok.Data;

import java.time.LocalDateTime;

/* UserDTO.java */
@Data
public class UserDTO2 {
    private Long userId;
    private String email;
    private String nickname;
    private String status; // ACTIVE / BANNED / DELETED
    private String loginType;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;

    // 조인을 통해 가져올 데이터
    private String roleName;
    private Integer conversationCount; // CHAT_ROOM 기준 집계
    private Integer activityScore; // USER_ACTIVITY_DAILY 기준
}
