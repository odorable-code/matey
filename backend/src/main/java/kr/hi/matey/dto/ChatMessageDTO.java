package kr.hi.matey.dto;

import lombok.Data;

@Data
public class ChatMessageDTO {
    private Long messageId;
    private Long chatRoomId;
    private String content;
    private String senderType;
    private String createdAt;
}
