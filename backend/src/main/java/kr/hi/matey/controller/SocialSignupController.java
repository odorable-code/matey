package kr.hi.matey.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import kr.hi.matey.dto.PendingSocialUser;
import kr.hi.matey.dto.SocialSignupRequestDTO;
import kr.hi.matey.service.SocialSignupService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth/social")
public class SocialSignupController {

    private final SocialSignupService socialSignupService;

    @GetMapping("/prefill")
    public Map<String, Object> prefill(HttpSession session) {
        PendingSocialUser pending = (PendingSocialUser) session.getAttribute("PENDING_SOCIAL_USER");

        Map<String, Object> result = new HashMap<>();
        if (pending != null) {
            result.put("nickname", pending.getNickname());
            result.put("birthdate", pending.getBirthdate());
            result.put("gender", pending.getGender());
        }
        return result;
    }

    @PostMapping("/signup")
    public Map<String, Object> signup(@RequestBody SocialSignupRequestDTO request,
                                      HttpSession session) {
        String token = socialSignupService.signup(request, session);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("token", token);
        return result;
    }
}