package kr.hi.matey.dao;

import kr.hi.matey.dto.ChatRoomDTO;
import kr.hi.matey.dto.ChatMessageDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ChatDAO {

    Long selectBotIdByName(String botName);

    Long selectFirstBackgroundId();
    int insertDefaultBackground();

    int countExclusiveByUserAndBot(@Param("userId") long userId, @Param("botId") long botId);
    int insertExclusive(@Param("userId") long userId, @Param("botId") long botId);
    Long selectExclusiveIdByUserAndBot(@Param("userId") long userId, @Param("botId") long botId);
    int insertUserBotRelation(@Param("exclusiveId") long exclusiveId);

    void insertChatRoom(Map<String, Object> param);
    void insertMessage(Map<String, Object> param);

    int updateChatRoomLastMessage(@Param("chatRoomId") long chatRoomId, @Param("lastMessage") String lastMessage);
    int updateChatRoomStatus(@Param("userId") long userId, @Param("chatRoomId") long chatRoomId, @Param("status") String status);

    List<ChatRoomDTO> selectChatRooms(long userId);
    List<ChatMessageDTO> selectMessages(long chatRoomId);
    int countChatRoomByUserAndId(@Param("userId") long userId, @Param("chatRoomId") long chatRoomId);
}
