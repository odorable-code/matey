package kr.hi.matey.dto;

import lombok.Data;

@Data
public class ChatRoomDTO {
    private Long chatRoomId;
    private String mateKey;
    private String mateName;
    private String title;
    private String lastMessage;
    private String lastMessageAt;
    private String status;
}
