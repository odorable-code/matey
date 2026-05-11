package kr.hi.matey.service;

import kr.hi.matey.dao.MyPageDAO;
import kr.hi.matey.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MyPageService {

    private final MyPageDAO myPageDAO;

    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfile(long userId) {
        return myPageDAO.selectUserProfile(userId);
    }

    @Transactional
    public void updateUserProfile(long userId, ProfileUpdateDTO dto) {
        myPageDAO.updateUserProfile(userId, dto);
    }

    @Transactional(readOnly = true)
    public BotMenuDTO getBotMenuData(long userId) {
        BotMenuDTO botMenu = myPageDAO.selectBotRelationInfo(userId);

        if (botMenu != null) {
            int currentExp = botMenu.getRemainPoint(); // DB의 current_exp를 DTO의 remainPoint에 매핑 중임
            int maxExp = 100; // 레벨업 필요 경험치 (기획에 맞게 수정)

            // UI에서는 progressPercent를 (현재 경험치 / 최대 경험치 * 100)으로 사용함
            botMenu.setProgressPercent((int) ((double) currentExp / maxExp * 100));
            // 남은 경험치 계산
            botMenu.setRemainPoint(maxExp - currentExp);
            
            botMenu.setBackgrounds(myPageDAO.selectUserBackgrounds(botMenu.getLevel()));
            botMenu.setMotions(myPageDAO.selectUserMotions(botMenu.getLevel()));
        }
        return botMenu;
    }

    @Transactional
    public BotMenuDTO interactWithBot(long userId, String actionType) {
        // 1. 행동에 따른 경험치 획득량 결정
        int expGain = switch (actionType) {
            case "feed" -> 10;
            case "touch" -> 5;
            case "play" -> 15;
            case "counsel" -> 20;
            default -> 0;
        };

        if (expGain > 0) {
            // 2. 현재 상태 조회 (DB에서 현재 레벨과 경험치를 가져옴)
            BotStatusDTO status = myPageDAO.getBotStatus(userId);
            int newExp = status.getExp() + expGain;
            int newLevel = status.getLevel();

            // 3. 레벨업 판단 로직 (경험치 100당 1레벨업)
            if (newExp >= 100) {
                int levelUpAmount = newExp / 100;
                newLevel += levelUpAmount;
                newExp = newExp % 100; // 100을 넘은 나머지만 유지

                // 레벨업 반영
                myPageDAO.updateBotLevel(userId, newLevel);
            }

            // 4. 경험치 업데이트
            myPageDAO.updateBotExp(userId, newExp);
        }

        // 상호작용 시간 갱신 및 결과 반환
        myPageDAO.updateLastInteractedAt(userId);
        return getBotMenuData(userId);
    }

    @Transactional(readOnly = true)
    public LetterBoxDTO getLetterBoxData(long userId) {
        LetterBoxDTO dto = new LetterBoxDTO();
        dto.setUnreadCount(myPageDAO.countUnreadLetters(userId));
        dto.setWeeklyCount(myPageDAO.countWeeklyLetters(userId));
        dto.setItems(myPageDAO.selectBotLetters(userId));
        return dto;
    }

    @Transactional
    public void markLetterAsRead(long userId, long letterId) {
        myPageDAO.updateLetterReadStatus(userId, letterId);
    }

    @Transactional
    public void deleteLetter(long userId, long letterId) {
        myPageDAO.deleteLetter(userId, letterId);
    }

    @Transactional(readOnly = true)
    public UserSettingsDTO getUserSettings(long userId) {
        return myPageDAO.selectUserSettings(userId);
    }

    @Transactional
    public void updateUserSettings(long userId, SettingUpdateDTO dto) {
        myPageDAO.updateUserSettings(userId, dto.getSettingKey(), dto.isSettingValue());
    }
}