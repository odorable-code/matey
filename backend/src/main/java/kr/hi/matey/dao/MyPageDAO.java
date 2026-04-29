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

    // 1. 사용자의 봇 친밀도 정보 조회 (EXCLUSIVE와 JOIN 필요)
    BotStatusDTO getBotStatus(long userId);

    // 2. 친밀도 단계(레벨) 업데이트
    void updateBotLevel(@Param("userId") long userId, @Param("intimacyId") int intimacyId);

    // 3. 친밀도 점수(경험치) 업데이트 - USER_BOT_RELATION의 intimacy_score(또는 별도 컬럼) 기준
    // 스키마에 점수 저장 컬럼이 안보여서, 기존 필드를 활용하거나 추가가 필요해 보입니다.
    // 여기서는 'intimacy_ID'를 레벨로 보고 진행합니다.
    void updateIntimacyScore(@Param("userId") long userId, @Param("score") int score);
}