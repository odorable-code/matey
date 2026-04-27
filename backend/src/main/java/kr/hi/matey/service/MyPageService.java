package kr.hi.matey.service;

import kr.hi.matey.dao.MyPageDAO;
import kr.hi.matey.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MyPageService {

    private final MyPageDAO myPageDAO;

    public UserProfileDTO getUserProfile(long userId) {
        return myPageDAO.selectUserProfile(userId);
    }

    public BotMenuDTO getBotMenuData(long userId) {
        BotMenuDTO botMenu = myPageDAO.selectBotRelationInfo(userId);

        if(botMenu != null) {
            // 친밀도 경험치 퍼센트 계산 (예: 1레벨당 요구 경험치가 100이라고 가정)
            int currentExp = botMenu.getRemainPoint(); // 쿼리에서 임시로 가져온 현재 경험치
            int maxExp = 100; // 레벨별 최대 경험치 로직 적용 필요
            botMenu.setProgressPercent((int) ((double) currentExp / maxExp * 100));
            botMenu.setRemainPoint(maxExp - currentExp);

            // 배경 및 모션 리스트 조회
            botMenu.setBackgrounds(myPageDAO.selectUserBackgrounds(userId, botMenu.getLevel()));
            botMenu.setMotions(myPageDAO.selectUserMotions(userId, botMenu.getLevel()));
        }
        return botMenu;
    }

    public LetterBoxDTO getLetterBoxData(long userId) {
        LetterBoxDTO dto = new LetterBoxDTO();
        dto.setUnreadCount(myPageDAO.countUnreadLetters(userId));
        dto.setWeeklyCount(myPageDAO.countWeeklyLetters(userId));
        dto.setItems(myPageDAO.selectBotLetters(userId));
        return dto;
    }

    public UserSettingsDTO getUserSettings(long userId) {
        return myPageDAO.selectUserSettings(userId);
    }

    @Transactional
    public void updateUserProfile(long userId, ProfileUpdateDTO dto) {
        myPageDAO.updateUserProfile(userId, dto);
    }

    @Transactional
    public void updateUserSettings(long userId, SettingUpdateDTO dto) {
        // 설정 키에 따라 동적으로 DB 업데이트
        myPageDAO.updateUserSettings(userId, dto.getSettingKey(), dto.isSettingValue());
    }

    @Transactional
    public void markLetterAsRead(long userId, long letterId) {
        myPageDAO.updateLetterReadStatus(userId, letterId);
    }

    @Transactional
    public void deleteLetter(long userId, long letterId) {
        myPageDAO.deleteLetter(userId, letterId);
    }

    @Transactional
    public BotMenuDTO interactWithBot(long userId, String actionType) {
        int expGain = 0;

        // 행동에 따른 경험치 부여량
        switch (actionType) {
            case "feed": expGain = 10; break;
            case "touch": expGain = 5; break;
            case "play": expGain = 15; break;
            case "counsel": expGain = 20; break;
        }

        // 1. 경험치 증가 (친밀도 업데이트)
        myPageDAO.updateBotIntimacy(userId, expGain);

        // 2. 레벨업 로직 체크 (DB 트리거로 처리하거나 여기서 로직 처리)
        // myPageDAO.checkAndLevelUp(userId);

        // 3. 마지막 상호작용 시간 업데이트
        myPageDAO.updateLastInteractedAt(userId);

        // 4. 업데이트된 최신 정보 반환
        return getBotMenuData(userId); // 기존에 작성된 GET 조회 메서드 재활용
    }
}