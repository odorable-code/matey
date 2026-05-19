package kr.hi.matey.controller;

import kr.hi.matey.service.OnlineUserRegistry;
import kr.hi.matey.util.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class PresenceController {

    private final OnlineUserRegistry onlineUserRegistry;

    @PostMapping("/heartbeat")
    public ResponseEntity<Void> heartbeat(@AuthenticationPrincipal CustomUser user) {
        if (user == null) return ResponseEntity.status(401).build();
        onlineUserRegistry.heartbeat(user.getUser().getUserId());
        return ResponseEntity.noContent().build();
    }
}
