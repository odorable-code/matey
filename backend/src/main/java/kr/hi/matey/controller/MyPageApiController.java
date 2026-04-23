package kr.hi.matey.controller;

import kr.hi.matey.dao.MyPageDAO;
import kr.hi.matey.dto.UserProfileDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class MyPageApiController {

    private final MyPageDAO myPageMapper;

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile() {
        String userId = "current-login-user-id";

        UserProfileDTO profile = myPageMapper.getUserProfile(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", profile);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/billing")
    public ResponseEntity<Map<String, Object>> getBilling() {
        String userId = "current-login-user-id";

        UserProfileDTO profile = myPageMapper.getUserProfile(userId);
        List<Map<String, Object>> payments = myPageMapper.getPaymentHistory(userId);

        Map<String, Object> billingData = new HashMap<>();
        billingData.put("subscriptionName", profile.getSubscriptionName());
        billingData.put("availablePoints", profile.getPoints());
        billingData.put("payments", payments);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", billingData);

        return ResponseEntity.ok(response);
    }
}
