package kr.hi.matey.security.filter;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.hi.matey.security.jwt.JwtTokenProvider;
import kr.hi.matey.service.MemberDetailService;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final MemberDetailService userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/api/v1/auth/login")
                || path.equals("/api/v1/auth/signup")
                || path.equals("/api/v1/auth/refresh")
                || path.equals("/api/v1/auth/logout")
                || path.equals("/api/v1/auth/admin/signup")
                || path.equals("/api/v1/auth/admin/login")   // ✅ 이게 없었음! 추가
                || path.startsWith("/ws-chat");               // ✅ 웹소켓도 skip
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Authorization 헤더 추출
        String header = request.getHeader("Authorization");

        // 2. 헤더 없거나 Bearer 형식 아니면 → 인증 없이 그냥 통과
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. "Bearer " 이후 토큰 문자열 추출
        String token = header.substring(7);

        // 4. 토큰 유효성 검사 실패 → 그냥 통과 (인증만 안 됨)
        if (!jwtTokenProvider.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 5. 토큰에서 클레임(사용자 정보) 추출
        Claims claims = jwtTokenProvider.parseClaims(token);

        // 6. refresh 토큰이면 인증 처리 안함
        if ("refresh".equals(claims.get("type"))) {
            filterChain.doFilter(request, response);
            return;
        }

        // 7. 사용자 아이디로 UserDetails 로드
        String username = claims.getSubject();
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // 8. 인증 객체 생성 후 SecurityContext에 저장
        Authentication auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        // 9. 다음 필터로 진행
        filterChain.doFilter(request, response);
    }
}