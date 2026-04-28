package kr.hi.matey.dao;

import kr.hi.matey.dto.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface MyPageDAO {
    // 1. Profile
    UserProfileDTO selectUserProfile(long userId);
    int updateUserProfile(@Param("userId") long userId, @Param("dto") ProfileUpdateDTO dto);

    // 2. Bot Menu & Interaction
    BotMenuDTO selectBotRelationInfo(long userId);
    List<BotMenuDTO.BackgroundDTO> selectUserBackgrounds(@Param("userLevel") int userLevel);
    List<BotMenuDTO.MotionDTO> selectUserMotions(@Param("userLevel") int userLevel);
    int updateBotIntimacy(@Param("userId") long userId, @Param("expGain") int expGain);
    int updateLastInteractedAt(long userId);

    // 3. Letters
    int countUnreadLetters(long userId);
    int countWeeklyLetters(long userId);
    List<LetterBoxDTO.LetterDTO> selectBotLetters(long userId);
    int updateLetterReadStatus(@Param("userId") long userId, @Param("letterId") long letterId);
    int deleteLetter(@Param("userId") long userId, @Param("letterId") long letterId);

    // 4. Settings
    UserSettingsDTO selectUserSettings(long userId);
    int updateUserSettings(@Param("userId") long userId, @Param("key") String key, @Param("value") boolean value);
}