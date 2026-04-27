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
            int currentExp = botMenu.getRemainPoint();
            int maxExp = 100; // 레벨업 필요 경험치 (기획에 맞게 수정)

            botMenu.setProgressPercent((int) ((double) currentExp / maxExp * 100));
            botMenu.setRemainPoint(maxExp - currentExp);
            botMenu.setBackgrounds(myPageDAO.selectUserBackgrounds(botMenu.getLevel()));
            botMenu.setMotions(myPageDAO.selectUserMotions(botMenu.getLevel()));
        }
        return botMenu;
    }

    @Transactional
    public BotMenuDTO interactWithBot(long userId, String actionType) {
        int expGain = switch (actionType) {
            case "feed" -> 10;
            case "touch" -> 5;
            case "play" -> 15;
            case "counsel" -> 20;
            default -> 0;
        };

        if (expGain > 0) {
            myPageDAO.updateBotIntimacy(userId, expGain);
        }
        myPageDAO.updateLastInteractedAt(userId);

        // TODO: 경험치가 100이 넘었을 때 레벨업을 처리하는 로직 추가 가능

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