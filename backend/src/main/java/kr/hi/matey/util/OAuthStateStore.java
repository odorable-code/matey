package kr.hi.matey.util;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class OAuthStateStore {

    // naver·kakao 둘 다 인가 직전에 create → 콜백에서 consume. 서버 여러 대면 Redis 같은 걸로 갈아타야 함
    private final Set<String> states = ConcurrentHashMap.newKeySet();

    public String create() {
        String state = UUID.randomUUID().toString();
        states.add(state);
        return state;
    }

    public boolean consume(String state) {
        return states.remove(state);
    }
}