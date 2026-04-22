package kr.hi.matey.security.jwt;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import kr.hi.matey.util.CustomUser;

@Component
public class JwtTokenProvider {
	// application.properties에 있는 secret을 가져와서 변환해서 사용
	private final Key key;
	private final long accessTokenValidity; // 토큰 유지 시간(ms)
	private final long refreshTokenValidity;// 리프레시 토큰 유지 시간(ms)

	public JwtTokenProvider(@Value("${jwt.secret}") String secret,
	                        @Value("${jwt.token-validity-in-seconds}") long accessSeconds,
	                        @Value("${jwt.refresh-token-validity-in-seconds}") long refreshSeconds) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.accessTokenValidity = accessSeconds * 1000;
		this.refreshTokenValidity = refreshSeconds * 1000;
	}

	/*
	 * ====================== Access Token ======================
	 */
	public String createAccessToken(CustomUser user) {
		return createToken(user, accessTokenValidity, false);
	}

	/*
	 * ====================== Refresh Token ======================
	 */
	public String createRefreshToken(CustomUser user) {
		return createToken(user, refreshTokenValidity, true);
	}

	/*
	 * ====================== 공통 토큰 생성 ======================
	 */
	private String createToken(CustomUser user, long validity, boolean isRefresh) {
		// 유지 시간을 이용하여 만료일을 계산
		long now = System.currentTimeMillis(); // 현재 시간을 ms초로 변환
		Date expiry = new Date(now + validity);// 현재 시간 + 유지시간을 날짜 객체로 변환

		var builder = Jwts.builder().setSubject(user.getUsername()) // 토큰 소유자
				.setIssuedAt(new Date(now)) // 토큰 발생시간
				.setExpiration(expiry) // 토큰 만료시간
				.signWith(key, SignatureAlgorithm.HS256); // 서명

		if (isRefresh) {
			builder.claim("type", "refresh"); // 리프레시 토큰임을 알려주도록 type을 설정
		} else {
			// 토큰에 넣고 싶은 정보를 claim을 통해 추가
			// builder.claim("email", user.getUser().getUser_email());
			builder.claim("role", user.getAuthorities().iterator().next().getAuthority());

			// 🔥 추가
			builder.claim("id", user.getUser().getUserId());
			builder.claim("name", user.getUser().getName());
		}
		// 토큰을 반환
		return builder.compact();
	}

	/*
	 * ====================== 토큰 파싱 & 검증 ======================
	 */
	public Claims parseClaims(String token) {
		return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
	}

	// 토큰이 리프레쉬 토큰인지 알려줌
	public boolean isRefreshToken(String token) {
		return "refresh".equals(parseClaims(token).get("type"));
	}

	/*
	 * ====================== 토큰 유효성 검증 ======================
	 */
	public boolean validateToken(String token) {
		try {
			// parseClaims가 성공하면 정상 토큰
			parseClaims(token);
			return true;
		} catch (Exception e) {
			// 예외가 발생하면 잘못된 토큰
			return false;
		}
	}
}