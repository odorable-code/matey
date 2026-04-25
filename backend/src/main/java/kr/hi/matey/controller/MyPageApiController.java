package kr.hi.matey.controller;

import kr.hi.matey.dao.MyPageDAO;
import kr.hi.matey.dto.UserProfileDTO;
import kr.hi.matey.util.CustomUser;
import kr.hi.matey.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
        long userId = user.getUser().getUserId();

        UserVO profile = myPageMapper.getUserProfile(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", profile);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/profile")
    public ResponseEntity<Boolean> patchProfile(
            @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();
        myPageMapper.setUserProfile(userId);
        return ResponseEntity.ok(true);
    }
}
