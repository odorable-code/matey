package kr.hi.matey.security.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import kr.hi.matey.security.filter.JwtAuthenticationFilter;
import kr.hi.matey.service.MemberDetailService;
import lombok.AllArgsConstructor;

@Configuration
@EnableWebSecurity
@AllArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final MemberDetailService userDetailsService;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // 인증 없이 허용할 경로들
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/v1/hospitals/**", "/api/v1/pharmacy/**").permitAll()
                        .requestMatchers("/api/v1/check-id", "/api/v1/users/**").permitAll()
                        .requestMatchers("/api/v1/reviews/**", "/uploads/**").permitAll()
                        .requestMatchers("/api/v1/qnas/**", "/api/v1/qnawrite").permitAll()

                        // ⭐ 웹소켓 연결 경로 허용 (너희가 설정한 endpoint 주소로 맞춰야 함)
                        .requestMatchers("/ws-stomp/**").permitAll()

                        // 인증이 필요한 경로들
                        .requestMatchers("/api/v1/reviews/*/comments/**").authenticated()
                        .requestMatchers("/api/v1/reviews/*/likes").authenticated()

                        // SecurityConfig.java에 추가
                        .requestMatchers("/uploads/**").permitAll()

                        .anyRequest().permitAll()
                )
                .userDetailsService(userDetailsService)
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // ⭐ 중요: 로컬 3000 포트와 AWS 서버 주소를 모두 허용함
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "http://3.38.49.151:3000", // 프론트엔드 AWS IP (확인 후 수정!)
                "http://3.38.49.151"        // 포트 없는 기본 주소도 추가
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // 쿠키/인증 헤더 허용
        config.setExposedHeaders(List.of("Authorization")); // 클라이언트가 JWT 헤더를 읽을 수 있게 노출

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}