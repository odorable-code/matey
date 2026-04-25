package kr.hi.matey.controller;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import kr.hi.matey.dto.PasswordResetDto;
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
        // HTTP에서도 쿠키를 보내겠다(https://가 아니기 때문에)
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        return cookie;
    }

 // 이메일 중복 확인
 	@GetMapping("/check-email")
     public ResponseEntity<?> checkEmail(@RequestParam("email") String email) {
 		System.out.println("checkEmail :" + email);
         boolean isEmailDuplicate = authService.isEmailDuplicateSignup(email);
         Map<String, Boolean> response = new HashMap<>();
         response.put("isEmailDuplicate", isEmailDuplicate);
         System.out.println("isEmailDuplicate: " + isEmailDuplicate);
         
         return ResponseEntity.ok(response);
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
            // 회원가입 성공 → 즉시 로그인 처리
        	// 사용자가 입력한 아이디(userId)와 비밀번호(originalPw)를 바탕으로 "이 사람이 맞는지 확인해달라"는 일종의 '신분증 신청서'를 만드는 단계
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(user.getUserId(), originalPw);

            // 스프링 시큐리티의 인증 매니저가 실제로 DB에 저장된 비밀번호와 사용자가 입력한 비밀번호를 비교해서 인증 성공 > 사용자 정보가 담긴 Authentication 객체를 반환
            Authentication auth = authenticationManager.authenticate(authToken);
            
            // 인증이 완료된 결과물(auth)에서 사용자의 상세 정보 객체를 꺼내옴
            CustomUser customUser = (CustomUser) auth.getPrincipal();

            // 어세스 토큰 생성
            String accessToken = jwtTokenProvider.createAccessToken(customUser);
            // 리프레쉬 토큰 생성
            String refreshToken = jwtTokenProvider.createRefreshToken(customUser);

            response.addCookie(makeRefreshCookie(refreshToken, 60 * 60 * 24 * 7));

            Map<String, Object> responseBody = new HashMap<>();
            
            responseBody.put("message", "회원가입이 완료되었어요.");
            
            // User 정보를 담은 객체 (비밀번호 제외)
            Map<String, Object> userData = new HashMap<>();
            userData.put("email", user.getEmail());
            userData.put("nickname", user.getNickname());
            responseBody.put("user", userData);
            
            responseBody.put("accessToken", accessToken);
            
            return ResponseEntity.ok(responseBody);
            

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

            // 음수 (예: -1): 쿠키를 별도의 파일로 저장하지 않고 브라우저가 켜져 있는 동안만 유지. 브라우저(모든 탭과 창)를 완전히 닫으면 삭제. (일반 로그인에 사용)
            // 0: 쿠키를 즉시 삭제하라는 뜻. (로그아웃 구현 시 사용)
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
		
		// 현재 로그인된 사용자의 아이디를 가져옴.
		// auth.isAuthenticated(): 이 사용자가 현재 유효하게 인증된(로그인된) 상태인가? > true 반환: 아이디/비밀번호가 일치했거나, 유효한 토큰을 가지고 있어서 서버가 "이 사람은 누군지 확실히 알아!"라고 인정한 상태
	    if (auth != null && auth.isAuthenticated()) {
	    	// 인증 객체(customUser) 안에 들어있는 실제 유저 정보에서 고유 식별 번호(Primary Key인 ID 값)를 꺼내오는 과정
	    	// getPrincipal()의 return 타입은 object기 때문에 CustomUser로 형변환을 해서 userId 로 가는 유일한 통로 들어가기
	    	// 1. 가장 바깥 상자: Authentication (스프링이 관리) 2. 중간 상자: CustomUser (사용자님이 만든 클래스) 3. 안쪽 상자: UserVO (실제 데이터 뭉치) 4. 알맹이: userId
	        CustomUser customUser = (CustomUser) auth.getPrincipal();
	        Long userId = customUser.getUser().getUserId();
	        
	        // 서비스에게 DB에 저장된 자동 로그인 토큰을 지우게 함
	        boolean removeAutoLoginToken = authService.removeAutoLoginToken(userId);
	        
	        if (removeAutoLoginToken) {
	            // DB 청소 완료 -> 브라우저 쿠키도 삭제 명령
	        	// 만약 서버에서 쿠키를 만들 때 HttpOnly 옵션을 넣었다면, 자바스크립트(localStorage.removeItem 등)로는 절대로 그 쿠키를 읽거나 지울 수 없음(해커가 악성 스크립트를 심어서 내 토큰을 훔쳐가는 걸 막으려고 브라우저가 자바스크립트의 접근을 차단해버리기 때문)
	    	    // 쿠키를 지움
	        	response.addCookie(makeRefreshCookie(null, 0));
	            return ResponseEntity.ok(Map.of("message", "성공적으로 로그아웃되었습니다."));
	            
	        } else {
	            // 유저를 찾지 못했거나 이미 로그아웃된 상태
	            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "이미 로그아웃되었거나 오류가 발생했습니다."));
	        }
	    }
        
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
	@PostMapping("/forgot-id")
    public ResponseEntity<Map<String, String>> findId(@RequestBody UserDTO user) {
		
		
        String id = authService.findId(user);
        
        return id != null ? ResponseEntity.ok(Map.of("message", id)) : ResponseEntity.status(404).body(Map.of("message", "일치하는 아이디를 찾을 수 없습니다."));
    }
	
	
	// 비번 재설정 1(이메일 존재 확인하고 이메일로 링크 전송)
	@PostMapping("/forgot-password")
	public ResponseEntity<?> forgotPassword(@RequestBody UserDTO user){
		// 이메일이 db와 일치하는지 확인
		boolean isEmailDuplicatePw = authService.isEmailDuplicatePw(user);
		
		// 일치하면 이메일로 메시지 전송
		if (!isEmailDuplicatePw) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message","일치하는 이메일을 찾을 수 없습니다."));
		}
		
		// 서비스에게 비번 재설정 페이지 링크 발송
		boolean sendLink = authService.sendLink(user);
		
		if (!sendLink) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "링크를 발송하는데 실패했습니다."));
		}
		else {
			return ResponseEntity.ok(Map.of("message", "이메일로 재설정 링크를 보냈습니다. 메일함을 확인하세요."));
		}
		
	}
	
	// 비번 재설정 2(새로운 비번 db에 저장)
	@PostMapping("/reset-password")
	public ResponseEntity<?> resetPassword(@RequestBody PasswordResetDto resetDto){
		
		boolean isSuccess = authService.updatePassword(resetDto.getToken(), resetDto.getNewpassword());
		if (isSuccess) {
	        return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 변경되었습니다."));
	    } else {
	        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "유효하지 않거나 만료된 토큰입니다."));
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
        
        // DB에 저장된 리프레시 토큰과 일치하는지 검증
        if (!authService.isValidRefreshToken(claims.getSubject(), refreshToken)) {
            return ResponseEntity.status(401).build();
        }
        CustomUser user = (CustomUser) userDetailsService.loadUserByUsername(claims.getSubject());
        return ResponseEntity.ok(Map.of("accessToken", jwtTokenProvider.createAccessToken(user)));
    }
    
    // 자동 로그인이 되어 있다면 사용자가 사이트에 접속했을 때 화면에 "료그인 계속 유지하기" 에 체크 표시를 프로그래밍적으로 넣어준다.
    // 만약 사용자가 자동 로그인을 하고, 로그아웃을 직접 했다면 서버와 브라우저에 저장된 모든 토큰/쿠키를 지우고 화면의 "로그인 계속 유지하기" 체크박스도 해제해야함

}
