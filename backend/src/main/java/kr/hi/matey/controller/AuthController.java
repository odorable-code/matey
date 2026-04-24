package kr.hi.matey.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import kr.hi.matey.dto.PasswordResetDto;
import kr.hi.matey.dto.UserDTO;
import kr.hi.matey.security.jwt.JwtTokenProvider;
import kr.hi.matey.service.AuthService;
import kr.hi.matey.service.MemberDetailService;
import kr.hi.matey.service.UserService;
import kr.hi.matey.util.CustomUser;
import lombok.AllArgsConstructor;

@Tag(name = "Authentication/Authorization", description = "인증/인가 API")
@RestController
@RequestMapping("/api/v1/auth")
@AllArgsConstructor
public class AuthController {
	private final AuthService authService;
	private final JwtTokenProvider jwtTokenProvider;
	// 스프링 시큐리티에서 사용자가 로그인(ID/PW 입력)을 시도했을 때, "이 사람이 우리 회원이 맞는가?"를 최종적으로 결정
	private final AuthenticationManager authenticationManager;

    private final UserService userService;
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
	
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody UserDTO user, HttpServletResponse response){
		
		System.out.println("LoginDTO: " + user);
		
		try {
			
			boolean res = authService.login(user);
			
			if(!res) {
				return ResponseEntity.status(400)
	                    .body(Map.of("message", "로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요."));
			}
			
			UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(user.getUserId(), user.getPassword());

            Authentication auth = authenticationManager.authenticate(authToken);
            CustomUser customUser = (CustomUser) auth.getPrincipal();

            String accessToken  = jwtTokenProvider.createAccessToken(customUser);
            String refreshToken = jwtTokenProvider.createRefreshToken(customUser);
            
            // 사용자가 체크박스를 눌렀을 때만 실행됩니다.
            if (user.isRememberMe()) {
                authService.enableAutoLogin(customUser.getUser().getUserId(), refreshToken);
            }

            // 음수 (예: -1): 쿠키를 별도의 파일로 저장하지 않고 브라우저가 켜져 있는 동안만 유지합니다. 브라우저(모든 탭과 창)를 완전히 닫으면 삭제됩니다. (일반 로그인에 사용)
            // 0: 쿠키를 즉시 삭제하라는 뜻입니다. (로그아웃 구현 시 사용)
            int cookieMaxAge = user.isRememberMe() ? 60 * 60 * 24 * 30 : -1;
            response.addCookie(makeRefreshCookie(refreshToken, cookieMaxAge));
            System.out.println("login success: " + customUser.getUser().getUserId());

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("accessToken", accessToken);
            responseBody.put("user", Map.of(
                "userName", customUser.getUser().getUserName(),
                "nickname", customUser.getUser().getNickname() 
            ));
            return ResponseEntity.ok(responseBody);
			
		}catch(Exception e) {
			return ResponseEntity.status(401)
                    .body(Map.of("message", "아이디 또는 비밀번호가 올바르지 않습니다."));
		}
	}
	
	
	@PostMapping("/logout")
	public ResponseEntity<?> logout(HttpServletResponse response, Authentication auth) {
		
		// 1. 현재 로그인된 사용자의 아이디를 가져옵니다.
	    if (auth != null && auth.isAuthenticated()) {
	        CustomUser customUser = (CustomUser) auth.getPrincipal();
	        Long userId = customUser.getUser().getUserId();
	        
	        // 서비스에게 DB에 저장된 자동 로그인 토큰을 지우게 함
	        authService.disableAutoLogin(userId);
	    }
		
        response.addCookie(makeRefreshCookie(null, 0));
        return ResponseEntity.ok(Map.of("message", "로그아웃 되었습니다."));
    }
	
	
	@GetMapping("/me")
	public ResponseEntity<?> me(@AuthenticationPrincipal CustomUser customUser, UserDTO user){
		try {    
		            
	            if (customUser == null) {
	            	return ResponseEntity.status(401).body("로그인이 필요합니다.");
	            }

	            return ResponseEntity.ok(Map.of(
	                    "userId", customUser.getUser().getUserId(),
	                    "userName", customUser.getUser().getUserName(),
	                    "nickname", customUser.getUser().getNickname(),
	                    "role", customUser.getUser().getRole()
	                ));
	            
	            } catch (Exception e) {
	            // 서버 내부 에러 등 예상치 못한 오류 시 500을 보냄
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                    .body(Map.of("message", "서버 오류가 발생했습니다."));
	            }
	}
	// 아이디(이메일) 찾기
	@PostMapping("/find-id")
    public ResponseEntity<Map<String, String>> findId(@RequestBody UserDTO user) {
    	System.out.println("findId : " + user);
        String id = authService.findId(user.getEmail());
        System.out.println("id: " + id);
        return id != null ? ResponseEntity.ok(Map.of("id", id)) : ResponseEntity.status(401).body(Map.of("message", "일치하는 아이디를 찾을 수 없습니다."));
    }
	
	// 이메일 중복 확인
	@GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam("email") String email) {
		System.out.println("checkEmail :" + email);
        boolean isEmailDuplicate = authService.isEmailDuplicate(email);
        System.out.println("isEmailDuplicate: " + isEmailDuplicate);
        
        return isEmailDuplicate != false ? ResponseEntity.ok(isEmailDuplicate) : ResponseEntity.notFound().build();
    }
	
	@PostMapping("/forgot-password")
	public ResponseEntity<?> forgotPassword(@RequestParam("email") String email){
		// 이메일이 db와 일치하는지 확인
		boolean isEmailDuplicate = authService.isEmailDuplicate(email);
		
		// 일치하면 이메일로 메시지 전송
		if (!isEmailDuplicate) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("일치하는 이메일을 찾을 수 없습니다.");
		}
		
		// 서비스에게 비번 재설정 페이지 링크 발송
		boolean sendLink = authService.sendLink(email);
		
		if (!sendLink) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("링크를 발송하는데 실패했습니다.");
		}
		else {
			return ResponseEntity.ok("이메일로 재설정 링크를 보냈습니다. 메일함을 확인하세요.");
		}
		
	}
	
	
	@PostMapping("/reset-password")
	public ResponseEntity<?> resetPassword(@RequestBody PasswordResetDto resetDto){
		
		boolean isSuccess = authService.updatePassword(resetDto.getToken(), resetDto.getNewpassword());
		if (isSuccess) {
	        return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
	    } else {
	        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("유효하지 않거나 만료된 토큰입니다.");
	    }
	}


    @Operation(summary = "토큰 갱신")
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {

        if (refreshToken == null || !jwtTokenProvider.isRefreshToken(refreshToken)) {
            return ResponseEntity.status(401).build();
        }

        Claims claims = jwtTokenProvider.parseClaims(refreshToken);
        
        // [추가] DB에 저장된 리프레시 토큰과 일치하는지 검증
        if (!authService.isValidRefreshToken(claims.getSubject(), refreshToken)) {
            return ResponseEntity.status(401).build();
        }
        CustomUser user = (CustomUser) userDetailsService.loadUserByUsername(claims.getSubject());
        return ResponseEntity.ok(Map.of("accessToken", jwtTokenProvider.createAccessToken(user)));
    }
    
    // 자동 로그인이 되어 있다면 사용자가 사이트에 접속했을 때 화면에 "료그인 계속 유지하기" 에 체크 표시를 프로그래밍적으로 넣어준다.
    // 만약 사용자가 자동 로그인을 하고, 로그아웃을 직접 했다면 서버와 브라우저에 저장된 모든 토큰/쿠키를 지우고 화면의 "로그인 계속 유지하기" 체크박스도 해제해야함

}
