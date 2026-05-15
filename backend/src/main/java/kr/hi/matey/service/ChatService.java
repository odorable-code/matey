package kr.hi.matey.service;

import kr.hi.matey.dao.ChatDAO;
import kr.hi.matey.dto.ChatRoomDTO;
import kr.hi.matey.dto.ChatMessageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatDAO chatDAO;

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
    public Long saveMessage(long userId, long chatRoomId, String content, String senderType) {
        if (chatDAO.countChatRoomByUserAndId(userId, chatRoomId) == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");
        }

        Map<String, Object> param = new HashMap<>();
        param.put("chatRoomId", chatRoomId);
        param.put("content", content);
        param.put("senderType", senderType);
        chatDAO.insertMessage(param);

        String preview = content.length() > 100 ? content.substring(0, 100) : content;
        chatDAO.updateChatRoomLastMessage(chatRoomId, preview);
        return ((Number) param.get("messageId")).longValue();
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDTO> getChatRooms(long userId) {
        return chatDAO.selectChatRooms(userId);
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
}
