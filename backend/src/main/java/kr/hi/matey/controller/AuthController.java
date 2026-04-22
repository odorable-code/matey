package kr.hi.matey.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.authentication.AuthenticationManager;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import kr.hi.matey.dto.UserDTO;
import kr.hi.matey.security.jwt.JwtTokenProvider;
import kr.hi.matey.service.AuthService;
import kr.hi.matey.util.CustomUser;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("api/v1/auth")
@AllArgsConstructor
public class AuthController {
	private final AuthService authService;
	private final JwtTokenProvider jwtTokenProvider;
	private final AuthenticationManager authenticationManager;
	
	private Cookie makeRefreshCookie(String refreshToken, int maxAge) {
    	Cookie cookie = new Cookie("refreshToken" , refreshToken);
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

        // signup() 호출 전에 원본 비밀번호 저장(signup() 내부에서 BCrypt 인코딩 해버리기 때문)
        String originalPw = user.getUserPw();

        boolean res = authService.signup(user);

        if (!res) {
            return ResponseEntity.status(400)
                    .body(Map.of("message", "회원가입에 실패했습니다."));
        }

        try {
            // 회원가입 성공 → 즉시 로그인 처리
        	
        	// 사용자가 입력한 아이디로 암호화 전 비밀번호를 가지고 '인증권'을 만듬
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(user.getUserId(), originalPw);

            // 설정된 authenticationManager에게 인증권을 던짐
            Authentication auth = authenticationManager.authenticate(authToken);
            
            // 인증에 설공하면 인증 결과물을 꺼내서 우리가 만든 customUser 타입으로 형변환
            CustomUser customUser = (CustomUser) auth.getPrincipal();

            String accessToken  = jwtTokenProvider.createAccessToken(customUser);
            String refreshToken = jwtTokenProvider.createRefreshToken(customUser);

            response.addCookie(makeRefreshCookie(refreshToken, 60 * 60 * 24 * 7));

            // 기존 login()과 동일한 형태로 accessToken 반환
            return ResponseEntity.ok(Map.of("accessToken", accessToken));

        } catch (Exception e) {
            // 자동 로그인 실패해도 회원가입은 성공했으므로 성공 응답
            System.out.println("자동 로그인 실패: " + e.getMessage());
            return ResponseEntity.ok(Map.of("success", true));
        }
    }
	
	@PostMapping("/login")
	public String login(){
		return "";
	}
	
	@GetMapping("/me")
	public String me(){
		return "";
	}
	
	@PostMapping("/logout")
	public String logout(){
		return "";
	}
	
	
}
