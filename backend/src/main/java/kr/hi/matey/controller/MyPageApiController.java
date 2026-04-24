package kr.hi.matey.controller;

import kr.hi.matey.dao.MyPageDAO;
import kr.hi.matey.dto.UserProfileDTO;
import kr.hi.matey.util.CustomUser;
import kr.hi.matey.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigInteger;
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
    public ResponseEntity<Map<String, Object>> getProfile(
            @AuthenticationPrincipal CustomUser user
            ) {
        BigInteger userId = user.getUser().getUserId();

        UserVO profile = myPageMapper.getUserProfile(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", profile);

        return ResponseEntity.ok(response);
    }
}
