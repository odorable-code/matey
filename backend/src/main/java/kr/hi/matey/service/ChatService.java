package kr.hi.matey.service;

import kr.hi.matey.dao.ChatDAO;
import kr.hi.matey.dao.MyPageDAO;
import kr.hi.matey.dto.ChatRoomDTO;
import kr.hi.matey.dto.ChatMessageDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private static final long COUNSEL_LETTER_TYPE_ID = 1L; // RECONNECT 타입 재활용

    @Value("${fastapi.base-url}")
    private String fastapiBaseUrl;

    private final ChatDAO chatDAO;
    private final MyPageDAO myPageDAO;
    private final NotificationService notificationService;

    @Transactional
    public Long createChatRoom(long userId, String mateKey, String title) {
        Long botId = chatDAO.selectBotIdByName(mateKey);
        if (botId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 봇입니다: " + mateKey);
        }

        // EXCLUSIVE 없으면 생성 (USER_BOT_RELATION 포함)
        if (chatDAO.countExclusiveByUserAndBot(userId, botId) == 0) {
            chatDAO.insertExclusive(userId, botId);
            Long eid = chatDAO.selectExclusiveIdByUserAndBot(userId, botId);
            if (eid != null) {
                chatDAO.insertUserBotRelation(eid);
            }
        }
        Long exclusiveId = chatDAO.selectExclusiveIdByUserAndBot(userId, botId);

        // CHAT_BACKGROUND 없으면 기본값 삽입
        Long backgroundId = chatDAO.selectFirstBackgroundId();
        if (backgroundId == null) {
            chatDAO.insertDefaultBackground();
            backgroundId = chatDAO.selectFirstBackgroundId();
        }

        Map<String, Object> param = new HashMap<>();
        param.put("exclusiveId", exclusiveId);
        param.put("backgroundId", backgroundId);
        param.put("title", title != null && !title.isBlank() ? title : "새로운 대화");
        chatDAO.insertChatRoom(param);
        return ((Number) param.get("chatRoomId")).longValue();
    }

    @Transactional
    public Long saveMessage(long userId, long chatRoomId, String content, String senderType, String emotionCode) {
        if (chatDAO.countChatRoomByUserAndId(userId, chatRoomId) == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");
        }

        Long emotionId = null;
        if (emotionCode != null && !emotionCode.isBlank()) {
            emotionId = chatDAO.selectEmotionIdByCode(emotionCode);
        }

        Map<String, Object> param = new HashMap<>();
        param.put("chatRoomId", chatRoomId);
        param.put("content", content);
        param.put("senderType", senderType);
        param.put("emotionId", emotionId);
        chatDAO.insertMessage(param);

        if ("BOT".equalsIgnoreCase(senderType)) {
            String preview = content.length() > 100 ? content.substring(0, 100) : content;
            chatDAO.updateChatRoomLastMessage(chatRoomId, preview);
        }
        return ((Number) param.get("messageId")).longValue();
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDTO> getChatRooms(long userId) {
        return chatDAO.selectChatRooms(userId);
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDTO> getArchivedChatRooms(long userId) {
        return chatDAO.selectArchivedChatRooms(userId);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getMessages(long userId, long chatRoomId) {
        if (chatDAO.countChatRoomByUserAndId(userId, chatRoomId) == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");
        }
        return chatDAO.selectMessages(chatRoomId);
    }

    @Transactional
    public void deleteChatRoom(long userId, long chatRoomId) {
        if (chatDAO.countChatRoomByUserAndId(userId, chatRoomId) == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");
        }
        chatDAO.updateChatRoomStatus(userId, chatRoomId, "DELETED");
    }

    /**
     * 채팅 종료: 대화를 ARCHIVED 상태로 바꾸고, 내용 요약 + 감정 관찰 쪽지를 생성해 BOT_LETTER에 저장합니다.
     */
    @Transactional
    public void endChatRoomWithLetter(long userId, long chatRoomId) {
        if (chatDAO.countChatRoomByUserAndId(userId, chatRoomId) == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");
        }

        List<ChatMessageDTO> messages = chatDAO.selectMessages(chatRoomId);
        Map<String, Object> context = chatDAO.selectChatContextForLetter(chatRoomId);

        chatDAO.updateChatRoomStatus(userId, chatRoomId, "ARCHIVED");

        if (context == null || messages.isEmpty()) {
            return;
        }

        long exclusiveId = ((Number) context.get("exclusiveId")).longValue();
        String botName = (String) context.get("botName");
        String botKey  = (String) context.get("botKey");
        String userNickname = (String) context.get("userNickname");
        long chatCount = ((Number) context.get("chatCount")).longValue();

        List<Map<String, String>> msgList = messages.stream()
                .map(m -> Map.of("role", m.getSenderType(), "content", m.getContent()))
                .collect(Collectors.toList());

        Map<String, Object> payload = new HashMap<>();
        payload.put("botName", botName);
        payload.put("botKey", botKey);
        payload.put("userNickname", userNickname);
        payload.put("isFirstCounsel", chatCount <= 1);
        payload.put("messages", msgList);

        try {
            RestTemplate restTemplate = new RestTemplate();
            String fastapiUrl = fastapiBaseUrl + "/api/generate-chat-letter";
            @SuppressWarnings("unchecked")
            Map<String, Object> result = restTemplate.postForObject(fastapiUrl, payload, Map.class);
            if (result != null) {
                String title = (String) result.get("title");
                String content = (String) result.get("content");
                myPageDAO.insertBotLetterByExclusiveId(exclusiveId, COUNSEL_LETTER_TYPE_ID, title, content);
                notificationService.createNotification(userId, "BOT_MESSAGE", "새 쪽지가 도착했어요!", null, null);
            }
        } catch (Exception e) {
            log.warn("[ChatService] 채팅 쪽지 생성 실패 chatRoomId={}", chatRoomId, e);
        }
    }
}
