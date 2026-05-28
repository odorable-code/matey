package kr.hi.matey.service;

import kr.hi.matey.dao.MyPageDAO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class LetterScheduler {

    private static final long RECONNECT_TYPE_ID = 1L;
    private static final int SPONTANEOUS_COOLDOWN_HOURS = 4; // 동일 유저에게 4시간 내 재발송 금지
    private static final int SPONTANEOUS_MAX_PER_RUN = 3;    // 1회 실행당 최대 발송 수

    @Value("${fastapi.base-url}")
    private String fastapiBaseUrl;

    private final MyPageDAO myPageDAO;
    private final OnlineUserRegistry onlineUserRegistry;
    private final NotificationService notificationService;

    /** 15분마다 — 현재 접속 중인 사용자에게 LLM이 자발적으로 쓴 쪽지 발송 */
    @Scheduled(fixedDelay = 900_000)
    @Transactional
    public void sendSpontaneousLetter() {
        onlineUserRegistry.purgeStale();
        List<Long> onlineIds = new ArrayList<>(onlineUserRegistry.getOnlineUserIds());
        if (onlineIds.isEmpty()) return;

        // 쿨다운 미경과 유저 제거 후 셔플 → 최대 N명에게만 발송
        Collections.shuffle(onlineIds);
        int sent = 0;
        RestTemplate restTemplate = new RestTemplate();

        for (Long userId : onlineIds) {
            if (sent >= SPONTANEOUS_MAX_PER_RUN) break;
            if (myPageDAO.countRecentLetters(userId, SPONTANEOUS_COOLDOWN_HOURS) > 0) continue;

            Map<String, Object> context = myPageDAO.selectUserContextForLetter(userId);
            if (context == null) continue;
            String botName = (String) context.get("botName");
            String userNickname = (String) context.get("userNickname");
            if (botName == null || botName.isBlank()) continue;

            try {
                Map<String, Object> payload = Map.of(
                        "botName", botName,
                        "userNickname", userNickname
                );
                String spontaneousApiUrl = fastapiBaseUrl + "/api/generate-spontaneous-letter";
                @SuppressWarnings("unchecked")
                Map<String, Object> result = restTemplate.postForObject(spontaneousApiUrl, payload, Map.class);
                if (result != null) {
                    myPageDAO.insertBotLetter(userId, RECONNECT_TYPE_ID,
                            (String) result.get("title"), (String) result.get("content"));
                    notificationService.createNotification(userId, "BOT_MESSAGE", "새 쪽지가 도착했어요!", null, null);
                    sent++;
                }
            } catch (Exception e) {
                log.warn("[LetterScheduler] 자발적 쪽지 실패 userId={}", userId, e);
            }
        }
        if (sent > 0) log.info("[LetterScheduler] 자발적 쪽지 발송: {}명", sent);
    }

    /** 매일 오전 10시(한국 기준) — 하루 동안 접속이 없는 사용자에게 쪽지 발송 */
    @Scheduled(cron = "0 0 10 * * *", zone = "Asia/Seoul")
    @Transactional
    public void sendDailyAbsenceLetter() {
        List<Long> userIds = myPageDAO.selectAbsentUserIdsForLetter(1, 1);
        log.info("[LetterScheduler] 1일 부재 쪽지 대상: {}명", userIds.size());
        for (Long userId : userIds) {
            try {
                myPageDAO.insertBotLetter(
                        userId,
                        RECONNECT_TYPE_ID,
                        "멍멍 하루가 지났어요",
                        "멍멍 하루가 지났어요 무슨 일 있는거에요?"
                );
                notificationService.createNotification(userId, "BOT_MESSAGE", "새 쪽지가 도착했어요!", null, null);
            } catch (Exception e) {
                log.warn("[LetterScheduler] 1일 쪽지 실패 userId={}", userId, e);
            }
        }
    }

    /** 매일 오전 10시(한국 기준) — 일주일 동안 접속이 없는 사용자에게 쪽지 발송 */
    @Scheduled(cron = "0 0 10 * * *", zone = "Asia/Seoul")
    @Transactional
    public void sendWeeklyAbsenceLetter() {
        List<Long> userIds = myPageDAO.selectAbsentUserIdsForLetter(7, 7);
        log.info("[LetterScheduler] 7일 부재 쪽지 대상: {}명", userIds.size());
        for (Long userId : userIds) {
            try {
                myPageDAO.insertBotLetter(
                        userId,
                        RECONNECT_TYPE_ID,
                        "멍멍 보고 싶어요",
                        "멍멍 한 주가 지났어요.. 보고 싶어요 멍멍"
                );
                notificationService.createNotification(userId, "BOT_MESSAGE", "새 쪽지가 도착했어요!", null, null);
            } catch (Exception e) {
                log.warn("[LetterScheduler] 7일 쪽지 실패 userId={}", userId, e);
            }
        }
    }

    /** 매일 오전 10시(한국 기준) — 한 달 동안 접속이 없는 사용자에게 쪽지 발송 */
    @Scheduled(cron = "0 0 10 * * *", zone = "Asia/Seoul")
    @Transactional
    public void sendMonthlyAbsenceLetter() {
        List<Long> userIds = myPageDAO.selectAbsentUserIdsForLetter(30, 30);
        log.info("[LetterScheduler] 30일 부재 쪽지 대상: {}명", userIds.size());
        for (Long userId : userIds) {
            try {
                myPageDAO.insertBotLetter(
                        userId,
                        RECONNECT_TYPE_ID,
                        "멍멍... 한달이 지났어요",
                        "멍멍... 한달이 지났어요. 괜찮은지 걱정돼요 멍"
                );
                notificationService.createNotification(userId, "BOT_MESSAGE", "새 쪽지가 도착했어요!", null, null);
            } catch (Exception e) {
                log.warn("[LetterScheduler] 30일 쪽지 실패 userId={}", userId, e);
            }
        }
    }
}
