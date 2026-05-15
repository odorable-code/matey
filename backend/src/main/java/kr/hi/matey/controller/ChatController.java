package kr.hi.matey.controller;

import kr.hi.matey.dto.ChatRoomDTO;
import kr.hi.matey.dto.ChatMessageDTO;
import kr.hi.matey.service.ChatService;
import kr.hi.matey.util.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatRoomDTO>> getChatRooms(
            @AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(chatService.getChatRooms(user.getUser().getUserId()));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createRoom(
            @AuthenticationPrincipal CustomUser user,
            @RequestBody Map<String, String> body) {
        long userId = user.getUser().getUserId();
        String mateKey = body.get("mateKey");
        String title = body.get("title");
        Long chatRoomId = chatService.createChatRoom(userId, mateKey, title);
        return ResponseEntity.ok(Map.of("chatRoomId", chatRoomId));
    }

    @GetMapping("/{chatRoomId}/messages")
    public ResponseEntity<List<ChatMessageDTO>> getMessages(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable long chatRoomId) {
        return ResponseEntity.ok(chatService.getMessages(user.getUser().getUserId(), chatRoomId));
    }

    @PostMapping("/{chatRoomId}/messages")
    public ResponseEntity<Map<String, Object>> saveMessage(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable long chatRoomId,
            @RequestBody Map<String, String> body) {
        long userId = user.getUser().getUserId();
        String content = body.get("content");
        String senderType = body.get("senderType");
        Long messageId = chatService.saveMessage(userId, chatRoomId, content, senderType);
        return ResponseEntity.ok(Map.of("messageId", messageId));
    }

    @DeleteMapping("/{chatRoomId}")
    public ResponseEntity<Void> deleteRoom(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable long chatRoomId) {
        chatService.deleteChatRoom(user.getUser().getUserId(), chatRoomId);
        return ResponseEntity.noContent().build();
    }
}
