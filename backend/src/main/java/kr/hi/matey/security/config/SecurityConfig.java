package kr.hi.matey.security.config;

import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import kr.hi.matey.security.filter.JwtAuthenticationFilter;
import kr.hi.matey.service.MemberDetailService;
import lombok.RequiredArgsConstructor;

@Configuration
// 이 클래스가 Spring Security 설정을 담당하는 클래스임을 선언하며, 웹 보안 기능을 활성화
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final MemberDetailService userDetailsService;

    @Value("${app.cors.allowed-origin-patterns:http://localhost:3000}")
    private String allowedOriginPatternsRaw;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    // 보안 필터 체인을 정의하는 메소드. HttpSecurity 객체를 통해 세부적인 보안 정책을 구성
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
        
        		// CSRF(Cross-Site Request Forgery) 보호를 비활성화. REST API는 보통 세션을 사용하지 않고 토큰(JWT)을 사용하기 때문에 CSRF 공격으로부터 비교적 자유로워 관습적으로 끔.
                .csrf(csrf -> csrf.disable())
                // CORS(Cross-Origin Resource Sharing) 설정을 적용. 다른 도메인(예: React, Vue 프런트엔드)에서 이 서버로 API 요청을 보낼 수 있도록 허용하는 규칙을 연결.
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // 서버에서 세션을 생성하거나 유지하지 않도록 설정(JWT 인증 기반이므로 서버는 클라이언트의 상태를 저장하지 않는 'Stateless' 방식을 따름.)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // HTTP 요청에 대한 접근 권한(인가) 설정을 시작
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/auth/social/**").permitAll()
                        .requestMatchers("/oauth2/**").permitAll()

                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/v1/check-email", "/api/v1/users/**").permitAll()
                        .requestMatchers("/ws-stomp/**").permitAll()
                        .requestMatchers("/error").permitAll() // 에러 페이지 허용 (500 에러가 403으로 가려지는 현상 방지)
                        
                        // FAQ/문의 사유는 비로그인 조회 허용 (Support 모달/FAQ에서 사용)
                        .requestMatchers(HttpMethod.GET, "/api/mypage/support/faq").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/mypage/support/reasons").permitAll()

                        // 마이페이지 API는 인증된 사용자만 허용
                        .requestMatchers("/api/mypage/**").authenticated()

                        .requestMatchers(HttpMethod.GET, "/api/community/**").permitAll()

                        .anyRequest().authenticated()
                )
                .userDetailsService(userDetailsService)
                // JWT 인증 필터를 우선순위에 배치합니다. 아이디/비밀번호 인증 필터(UsernamePasswordAuthenticationFilter)가 실행되기 전에, 들어온 요청의 JWT 토큰을 먼저 검사하여 인증 처리.
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );
        // 설정한 내용을 바탕으로 SecurityFilterChain 객체를 생성하여 반환
        return http.build();
    }

    /** AuthController 로그인용: UserDetailsService와 BCrypt PasswordEncoder를 한 Provider에 묶습니다. */
    @Bean
    public AuthenticationManager authenticationManager(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(passwordEncoder);
        provider.setUserDetailsService(userDetailsService);
        return new ProviderManager(provider);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 허용할 주소 설정
        List<String> allowedOriginPatterns = Arrays.stream(allowedOriginPatternsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
        config.setAllowedOriginPatterns(allowedOriginPatterns);

        // 허용할 HTTP 메서드
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        // 허용할 헤더(클라이언트가 요청을 보낼 때 헤어에 어떤 정보를 담아도 다 받겠다)
        config.setAllowedHeaders(List.of("*"));
        // 쿠키 사용 허용
        config.setAllowCredentials(true);
        // 서버가 보낸 응답 헤더 중 Authorization 항목을 리액트(JS)가 읽을 수 있게 허용
        // 보안상 브라우저는 서버가 보낸 헤더를 함부로 읽지 못하게 막아두지만 프로젝트는 토큰을 주고받아야 하므로,
        // 리액트가 토큰이 담긴 Authorization 헤더를 꺼내 쓸 수 있게 명시적으로 열어준 것
        config.setExposedHeaders(List.of("Authorization"));

        // 위에서 설정한 config 내용들을 **"서버의 모든 경로(/**)"**에 적용하겠다는 선언
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
    
}