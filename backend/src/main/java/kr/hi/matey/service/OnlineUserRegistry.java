package kr.hi.matey.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OnlineUserRegistry {

    private static final long ONLINE_THRESHOLD_MS = 90_000; // 90초 — 30초 heartbeat에 여유분

    private final ConcurrentHashMap<Long, Long> lastSeen = new ConcurrentHashMap<>();

    public void heartbeat(long userId) {
        lastSeen.put(userId, System.currentTimeMillis());
    }

    public List<Long> getOnlineUserIds() {
        long cutoff = System.currentTimeMillis() - ONLINE_THRESHOLD_MS;
        List<Long> result = new ArrayList<>();
        lastSeen.forEach((userId, ts) -> {
            if (ts >= cutoff) result.add(userId);
        });
        return result;
    }

    /** 오래된 항목 제거 — 스케줄러에서 주기적으로 호출 */
    public void purgeStale() {
        long cutoff = System.currentTimeMillis() - ONLINE_THRESHOLD_MS * 10;
        lastSeen.entrySet().removeIf(e -> e.getValue() < cutoff);
    }
}
