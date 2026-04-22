package kr.hi.matey.util;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class OAuthStateStore {

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