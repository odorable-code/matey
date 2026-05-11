package kr.hi.matey.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;

/**
 * 개발 중 500 원인 요청(URL/쿼리스트링) 확인용.
 * (컨트롤러 진입 전 파라미터 바인딩에서 터지는 경우에도 요청 정보를 로그로 남김)
 */
@Configuration
@Slf4j
public class RequestLoggingConfig {

    @Bean
    public OncePerRequestFilter requestLoggingFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(
                    HttpServletRequest request,
                    HttpServletResponse response,
                    FilterChain filterChain
            ) throws ServletException, IOException {
                String uri = request.getRequestURI();
                String qs = request.getQueryString();
                String method = request.getMethod();
                log.info("[REQ] {} {}{}", method, uri, (qs == null || qs.isBlank()) ? "" : "?" + qs);
                filterChain.doFilter(request, response);
            }
        };
    }
}

