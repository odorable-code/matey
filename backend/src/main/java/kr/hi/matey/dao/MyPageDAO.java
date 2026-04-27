package kr.hi.matey.dao;

import kr.hi.matey.dto.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface MyPageDAO {
    // Profile
    UserProfileDTO selectUserProfile(long userId);

    // Bot Menu
    BotMenuDTO selectBotRelationInfo(long userId);
    List<BotMenuDTO.BackgroundDTO> selectUserBackgrounds(@Param("userId") long userId, @Param("userLevel") int userLevel);
    List<BotMenuDTO.MotionDTO> selectUserMotions(@Param("userId") long userId, @Param("userLevel") int userLevel);

    // Letters
    int countUnreadLetters(long userId);
    int countWeeklyLetters(long userId);
    List<LetterBoxDTO.LetterDTO> selectBotLetters(long userId);

    // Settings
    UserSettingsDTO selectUserSettings(long userId);
    int updateUserProfile(@Param("userId") long userId, @Param("dto") ProfileUpdateDTO dto);

    // Update Settings
    int updateUserSettings(@Param("userId") long userId, @Param("key") String key, @Param("value") boolean value);

    // Update & Delete Letters
    int updateLetterReadStatus(@Param("userId") long userId, @Param("letterId") long letterId);
    int deleteLetter(@Param("userId") long userId, @Param("letterId") long letterId);

    // Update Bot Intimacy (Interaction)
    int updateBotIntimacy(@Param("userId") long userId, @Param("expGain") int expGain);
    int updateLastInteractedAt(@Param("userId") long userId);
}