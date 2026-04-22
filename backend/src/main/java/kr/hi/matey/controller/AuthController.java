package kr.hi.matey.controller;

import java.util.HashMap;
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
import kr.hi.matey.domain.UserDTO;
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
	// 스프링 시큐리티에서 사용자가 로그인(ID/PW 입력)을 시도했을 때, "이 사람이 우리 회원이 맞는가?"를 최종적으로 결정
	private final AuthenticationManager authenticationManager;
	private final CustomUser customUser;

	private Cookie makeRefreshCookie(String refreshToken, int maxAge) {
    	Cookie cookie = new Cookie("refreshToken" , refreshToken);
    	// js가 이 쿠키를 읽지 못하게 막음(해커가 악성 스크립트를 심허 쿠키를 훔쳐가는 XSS 공격을 방어하기 위해)
    	cookie.setHttpOnly(true);
    	// HTTPS 가 아닌 일반 HTTP 연결에서도 쿠키를 전송할 수 있게 함(false), 실제 서비스가 될 때는 true로 바꿔야한다.
        cookie.setSecure(false);
        // 도메인의 모든 경로에서 이 쿠키를 사용할 수 있게 함(보통 로그인 정보는 사이트 전체에서 필요하기 때문)
        cookie.setPath("/");
        // 쿠키가 살아있을 시간(유효기간)을 초단위로 설정, 이 시간이 지나면 쿠키는 브라우저에서 자동으로 삭제됨
        cookie.setMaxAge(maxAge);
		return cookie;
	}
	
	@Operation(summary = "회원가입", description = "회원가입을 합니다.")
    @PostMapping("/signup")
	// ResponseEntity: 결과값과 HTTP 상태 코드를 함께 담아 응답하는 스프링의 표준 방식
    public ResponseEntity<?> signup(
            @RequestBody UserDTO user,
            HttpServletResponse response) {

        // signup() 호출 전에 원본 비밀번호 저장(signup() 내부에서 BCrypt 인코딩 해버리기 때문)
        String originalPw = user.getPassword();

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

            // 설정된 authenticationManager에게 인증권을 던져서 비밀번호 대조
            Authentication auth = authenticationManager.authenticate(authToken);
            
            // 인증에 설공하면 인증 결과물을 꺼내서 우리가 만든 customUser 타입으로 형변환
            CustomUser customUser = (CustomUser) auth.getPrincipal();

            String accessToken  = jwtTokenProvider.createAccessToken(customUser);
            String refreshToken = jwtTokenProvider.createRefreshToken(customUser);

            // 보안상 중요한 리프레시 토큰은 아까 만든 메서드를 통해 쿠키에 담아 사용자 브라우저에 저장시킴(7일)
            response.addCookie(makeRefreshCookie(refreshToken, 60 * 60 * 24 * 7));

            // 기존 login()과 동일한 형태로 accessToken 반환
            // 회원가입 성공, 자동로그인도 성공
            
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("accessToken", accessToken);
            responseBody.put("user", Map.of(
                "userId", customUser.getName(),
                "nickname", customUser.getNickname() 
            ));
            return ResponseEntity.ok(responseBody);

        } catch (Exception e) {
        	// 회원가입 성공, 자동로그인 실패
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
