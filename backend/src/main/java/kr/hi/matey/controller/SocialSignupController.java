package kr.hi.matey.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import kr.hi.matey.dto.SocialSignupRequestDTO;
import kr.hi.matey.service.SocialSignupService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth/social")
public class SocialSignupController {

    private final SocialSignupService socialSignupService;

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