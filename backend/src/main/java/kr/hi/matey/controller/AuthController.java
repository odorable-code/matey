package kr.hi.matey.controller;

import java.util.HashMap;
import java.util.Map;

import kr.hi.matey.dto.AdminsDTO;
import kr.hi.matey.dto.MemberDTO;
import kr.hi.matey.dto.UserDTO;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import kr.hi.matey.security.jwt.JwtTokenProvider;
import kr.hi.matey.service.AdminsService;
import kr.hi.matey.service.MemberDetailService;
import kr.hi.matey.service.UserService;
import kr.hi.matey.util.CustomUser;
import kr.hi.matey.vo.UserVO;
import lombok.AllArgsConstructor;

@Tag(name = "Authentication/Authorization", description = "인증/인가 API")
@RestController
@RequestMapping("/api/v1/auth")
@AllArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final MemberDetailService userDetailsService;


    private Cookie makeRefreshCookie(String refreshToken, int maxAge) {
        Cookie cookie = new Cookie("refreshToken", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        return cookie;
    }

    @Operation(summary = "회원가입", description = "회원가입을 합니다.")
    @PostMapping("/signup")
    public ResponseEntity<?> signup(
            @RequestBody UserDTO user,
            HttpServletResponse response) {  // ← HttpServletResponse 추가

        // ⭐ 핵심: signup() 호출 전에 원본 비밀번호 저장!
        // (signup() 내부에서 BCrypt 인코딩 해버리기 때문)
        String originalPw = user.getPassword();

        boolean res = userService.signup(user);

        if (!res) {
            return ResponseEntity.status(400)
                    .body(Map.of("message", "회원가입에 실패했습니다."));
        }

        try {
            // ✅ 회원가입 성공 → 즉시 로그인 처리
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(user.getUserId(), originalPw);

            Authentication auth = authenticationManager.authenticate(authToken);
            CustomUser customUser = (CustomUser) auth.getPrincipal();

            String accessToken = jwtTokenProvider.createAccessToken(customUser);
            String refreshToken = jwtTokenProvider.createRefreshToken(customUser);

            response.addCookie(makeRefreshCookie(refreshToken, 60 * 60 * 24 * 7));

            // ✅ 기존 login()과 동일한 형태로 accessToken 반환
            return ResponseEntity.ok(Map.of("accessToken", accessToken));

        } catch (Exception e) {
            // 자동 로그인 실패해도 회원가입은 성공했으므로 성공 응답
            System.out.println("자동 로그인 실패: " + e.getMessage());
            return ResponseEntity.ok(Map.of("success", true));
        }
    }

//    @Operation(summary = "로그인", description = "로그인을 해 토큰 정보를 얻어옵니다")
//    @PostMapping("/login")
//    public ResponseEntity<?> login(
//            @RequestBody LoginDTO user,
//            HttpServletResponse response
//    ) {
//    	System.out.println("LoginDTO:" + user);
//        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
//                user.userId(), user.userPw()
//        );
//        System.out.println(authToken);
//        Authentication authentication = authenticationManager.authenticate(authToken);
//        CustomUser customUser = (CustomUser) authentication.getPrincipal();
//        String accessToken = jwtTokenProvider.createAccessToken(customUser);
//        String refreshToken = jwtTokenProvider.createRefreshToken(customUser);
//
//        Cookie cookie = new Cookie("refreshToken", refreshToken);
//        cookie.setHttpOnly(true);
//        cookie.setSecure(false);
//        cookie.setPath("/");
//        cookie.setMaxAge(7 * 24 * 60 * 60);
//        return cookie;
//    }

    // ────────────────────────────────────────────────
    // 환자 회원가입
    // ────────────────────────────────────────────────
//    @Operation(summary = "회원가입")
//    @PostMapping("/signup")
//    public ResponseEntity<?> signup(@RequestBody UserDTO user) {
//        try {
//            boolean res = userService.signup(user);
//            if (!res) {
//                return ResponseEntity.status(400).body(Map.of("message", "회원가입에 실패했습니다."));
//            }
//            return ResponseEntity.ok(Map.of("success", true));
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.status(500).body(Map.of("message", "서버 오류: " + e.getMessage()));
//        }
//    }

    // ────────────────────────────────────────────────
    // 환자 로그인
    // ────────────────────────────────────────────────
    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminsDTO.LoginDTO user, HttpServletResponse response) {
        System.out.println("LoginDTO: " + user);

        try {
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(user.userId(), user.userPw());

            Authentication auth = authenticationManager.authenticate(authToken);
            CustomUser customUser = (CustomUser) auth.getPrincipal();

            String accessToken = jwtTokenProvider.createAccessToken(customUser);
            String refreshToken = jwtTokenProvider.createRefreshToken(customUser);

            response.addCookie(makeRefreshCookie(refreshToken, 60 * 60 * 24 * 7));
            System.out.println("login success: " + customUser.getUser().getUserId());

            return ResponseEntity.ok(Map.of("accessToken", accessToken));

        } catch (Exception e) {
            // ✅ BadCredentialsException, UsernameNotFoundException 등 모두 401로 처리
            System.out.println("login fail: " + e.getMessage());
            return ResponseEntity.status(401)
                    .body(Map.of("message", "아이디 또는 비밀번호가 올바르지 않습니다."));
        }
    }


    // ────────────────────────────────────────────────
    // 내 정보 조회  ✅ hoNum 추가
    // ────────────────────────────────────────────────
    @Operation(summary = "나의 정보")
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal CustomUser customUser) {
        if (customUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "UNAUTHORIZED"));
        }

        UserVO user = customUser.getUser();

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getUserId());
        result.put("role", user.getRole());
        result.put("name", user.getUserName());

        return ResponseEntity.ok(result);
    }

    // ────────────────────────────────────────────────
    // 토큰 갱신
    // ────────────────────────────────────────────────
    @Operation(summary = "토큰 갱신")
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {

        if (refreshToken == null || !jwtTokenProvider.isRefreshToken(refreshToken)) {
            return ResponseEntity.status(401).build();
        }

        Claims claims = jwtTokenProvider.parseClaims(refreshToken);
        CustomUser user = (CustomUser) userDetailsService.loadUserByUsername(claims.getSubject());
        return ResponseEntity.ok(Map.of("accessToken", jwtTokenProvider.createAccessToken(user)));
    }

    // ────────────────────────────────────────────────
    // 로그아웃
    // ────────────────────────────────────────────────
    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        response.addCookie(makeRefreshCookie(null, 0));
        return ResponseEntity.ok().build();
    }
}