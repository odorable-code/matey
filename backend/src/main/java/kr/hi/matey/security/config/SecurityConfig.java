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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import kr.hi.matey.security.filter.JwtAuthenticationFilter;
import kr.hi.matey.service.MemberDetailService;
import kr.hi.matey.util.UserRole;
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
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/auth/social/**").permitAll()
                        .requestMatchers("/oauth2/**").permitAll()

                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/v1/hospitals/**", "/api/v1/pharmacy/**").permitAll()
                        .requestMatchers("/api/v1/check-id", "/api/v1/users/**").permitAll()
                        .requestMatchers("/api/v1/reviews/**", "/uploads/**").permitAll()
                        .requestMatchers("/api/v1/qnas/**", "/api/v1/qnawrite").permitAll()
                        .requestMatchers("/ws-stomp/**").permitAll()

                        .requestMatchers("/api/v1/reviews/*/comments/**").authenticated()
                        .requestMatchers("/api/v1/reviews/*/likes").authenticated()

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

        // 허용할 주소 설정
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "http://3.38.49.151:3000",
                "http://3.38.49.151"
        ));

        // 허용할 HTTP 메서드
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
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
    
    @Bean
    // 자동로그인
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf ->csrf.disable())
	        .authorizeHttpRequests(/*생략*/)
	        .formLogin(/*생략*/)
            /* 자동로그인은 클라이언트(사용자) 컴퓨터에 쿠키를 만들어서 활용
             * => 동일한 이름(LC) 쿠키가 있는지 확인해서 있으면 값을 가져와
             *    로그인을 함
             * */
            .rememberMe(rm-> rm
    	    		//자동로그인이 체크되어 있으면 memberDetailService를 이용해서 로그인 진행
            	.userDetailsService(memberDetailService)
            	//쿠키에 저장할 토큰을 생성할 때 활용할 문자열
            	//이 문자열이 바뀌면 이전에 있던 토큰이 무효화 되어 자동 로그인 취소
            	//key에 들어가는 문자열은 노출되면 안됨.
            	//application.properties에 작성해서 관리해야함.
            	.key("abc123")
            	//쿠키 이름
            	.rememberMeCookieName("LC")
            	//쿠키 유효시간(단위 초).
            	.tokenValiditySeconds(60*60*24*7)//7일
            )
            .logout(/*생략*/);  
        return http.build();
    }
    
}