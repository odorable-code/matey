package kr.hi.matey.service;

import kr.hi.matey.dao.MyPageDAO;
import kr.hi.matey.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Date;
import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class MyPageService {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final MyPageDAO myPageDAO;

    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfile(long userId) {
        return myPageDAO.selectUserProfile(userId);
    }

    @Transactional
    public void updateUserProfile(long userId, ProfileUpdateDTO dto) {
        myPageDAO.updateUserProfile(userId, dto);
    }

    /**
     * 담당봇 선택 UI 전용 — JSON 루트 배열로 내려가므로 {@link BotMenuDTO} 안에 리스트가 누락되는 경우에도 안전합니다.
     */
    @Transactional(readOnly = true)
    public List<AssignableBotOption> listAssignableBotsForPicker() {
        List<AssignableBotOption> list = myPageDAO.selectBotsForPicker();
        return list != null ? list : List.of();
    }

    @Transactional(readOnly = true)
    public BotMenuDTO getBotMenuData(long userId) {
        List<AssignableBotOption> picker = myPageDAO.selectBotsForPicker();
        List<AssignableBotOption> safePicker = picker != null ? picker : List.of();

        BotMenuDTO botMenu = myPageDAO.selectBotRelationInfo(userId);

        if (botMenu != null) {
            int currentExp = botMenu.getRemainPoint(); // DB의 current_exp를 DTO의 remainPoint에 매핑 중임
            int maxExp = 100; // 레벨업 필요 경험치 (기획에 맞게 수정)

            // UI에서는 progressPercent를 (현재 경험치 / 최대 경험치 * 100)으로 사용함
            botMenu.setProgressPercent((int) ((double) currentExp / maxExp * 100));
            // 남은 경험치 계산
            botMenu.setRemainPoint(maxExp - currentExp);

            botMenu.setBackgrounds(myPageDAO.selectUserBackgrounds(botMenu.getLevel()));
            botMenu.setMotions(myPageDAO.selectUserMotions(userId, botMenu.getLevel()));
            botMenu.setFeedDoneToday(isFedTodaySeoul(botMenu.getLastFeedRewardAt()));
        } else {
            botMenu = new BotMenuDTO();
            botMenu.setLevel(1);
            botMenu.setRemainPoint(100);
            botMenu.setProgressPercent(0);
            botMenu.setFeedDoneToday(false);
            botMenu.setBackgrounds(myPageDAO.selectUserBackgrounds(1));
            botMenu.setMotions(new ArrayList<>());
        }
        botMenu.setAssignableBots(safePicker);
        return botMenu;
    }

    /**
     * 마이페이지 대시보드 담당 봇 변경. EXCLUSIVE·USER_BOT_RELATION이 없으면 생성합니다.
     */
    @Transactional
    public BotMenuDTO setAssignedBot(long userId, long botId) {
        if (botId <= 0) {
            throw new IllegalArgumentException("봇을 선택해 주세요.");
        }
        if (myPageDAO.countBotById(botId) == 0) {
            throw new IllegalArgumentException("존재하지 않는 봇이에요.");
        }
        if (myPageDAO.countExclusiveByUserAndBot(userId, botId) == 0) {
            myPageDAO.insertExclusive(userId, botId);
            Long exclusiveId = myPageDAO.selectExclusiveIdByUserAndBot(userId, botId);
            if (exclusiveId == null || exclusiveId <= 0) {
                throw new IllegalStateException("담당 봇 연결에 실패했어요.");
            }
            myPageDAO.insertUserBotRelation(exclusiveId, 1, 0);
        }
        myPageDAO.updateUserAssignedBot(userId, botId);
        return getBotMenuData(userId);
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

        BotStatusDTO status = null;
        if (expGain > 0 || "feed".equals(actionType)) {
            status = myPageDAO.getBotStatus(userId);
        }

        if ("feed".equals(actionType) && status != null && isFedTodaySeoul(status.getLastFeedRewardAt())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "오늘은 이미 먹이를 줬어요. 내일 다시 와 줘!"
            );
        }

        if (expGain > 0 && status != null) {
            int newExp = status.getExp() + expGain;
            int newLevel = status.getLevel();

            if (newExp >= 100) {
                int levelUpAmount = newExp / 100;
                newLevel += levelUpAmount;
                newExp = newExp % 100;

                myPageDAO.updateBotLevel(userId, newLevel);
            }

            myPageDAO.updateBotExp(userId, newExp);
        }

        if ("feed".equals(actionType) && expGain > 0 && status != null) {
            myPageDAO.updateLastFeedRewardAt(userId);
        }

        return getBotMenuData(userId);
    }

    @Transactional(readOnly = true)
    public LetterBoxDTO getLetterBoxData(long userId) {
        try {
            LetterBoxDTO dto = new LetterBoxDTO();
            dto.setUnreadCount(myPageDAO.countUnreadLetters(userId));
            dto.setWeeklyCount(myPageDAO.countWeeklyLetters(userId));
            List<LetterBoxDTO.LetterDTO> items = myPageDAO.selectBotLetters(userId);
            dto.setItems(items != null ? items : new ArrayList<>());
            return dto;
        } catch (RuntimeException ex) {
            log.warn("getLetterBoxData failed userId={}", userId, ex);
            LetterBoxDTO dto = new LetterBoxDTO();
            dto.setUnreadCount(0);
            dto.setWeeklyCount(0);
            dto.setItems(new ArrayList<>());
            return dto;
        }
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
    public String letterMessage(Long counselId) {
        if (counselId == null || counselId <= 0) {
            return null;
        }
        try {
            Map<String, Object> details = myPageDAO.getCounselDetail(counselId);
            if (details == null || details.isEmpty()) {
                return null;
            }
            Object countObj = details.get("counselCount");
            if (!(countObj instanceof Number)) {
                return null;
            }
            long count = ((Number) countObj).longValue();
            details.put("isFirstCounsel", count <= 1);

            RestTemplate restTemplate = new RestTemplate();
            String pythonUrl = "http://localhost:5000/generate-letters";
            ResponseEntity<Map> response = restTemplate.postForEntity(pythonUrl, details, Map.class);
            Map<?, ?> body = response.getBody();
            if (body == null) {
                return null;
            }
            Object msg = body.get("aiMessage");
            return msg != null ? String.valueOf(msg) : null;
        } catch (RuntimeException ex) {
            log.warn("letterMessage counselId={}", counselId, ex);
            return null;
        }
    }

    @Transactional(readOnly = true)
    public UserSettingsDTO getUserSettings(long userId) {
        return myPageDAO.selectUserSettings(userId);
    }

    @Transactional
    public void updateUserSettings(long userId, SettingUpdateDTO dto) {
        myPageDAO.updateUserSettings(userId, dto.getSettingKey(), dto.isSettingValue());
    }

    @Transactional
    public void withdrawUser(long userId) {
        myPageDAO.withdrawUser(userId);
    }

    /** Asia/Seoul 달력 기준으로, 해당 시각이 '오늘'이면 이미 오늘 먹이 보상을 받은 것으로 본다. */
    private static boolean isFedTodaySeoul(Date lastFeedRewardAt) {
        if (lastFeedRewardAt == null) {
            return false;
        }
        LocalDate todaySeoul = LocalDate.now(SEOUL);
        LocalDate fedDay = lastFeedRewardAt.toInstant().atZone(SEOUL).toLocalDate();
        return todaySeoul.equals(fedDay);
    }
}