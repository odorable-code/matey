package kr.hi.matey.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

/**
 * 브라우저 → Spring Boot → FastAPI 프록시.
 * 빌드된 React 앱이 relative path(/api/chat 등)로 요청을 보내면
 * Spring Boot가 받아서 Docker 내부 네트워크의 FastAPI로 전달한다.
 *
 * 대상 경로:
 *   /api/chat               (POST: AI 채팅, FastAPI RAG)
 *   /api/chat/gemini/**     (Gemini 계열)
 *   /api/chat/completions/** (OpenAI 호환)
 *   /api/analysis/**        (감정 분석)
 *   /api/health/**          (FastAPI health check)
 *   /api/preparing/**       (준비 중 상태)
 *
 * /api/chat/rooms/** 는 ChatController 가 처리하므로 여기서 제외됨.
 */
@RestController
@Slf4j
public class FastApiProxyController {

    @Value("${fastapi.base-url}")
    private String fastapiBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @RequestMapping({
        "/api/chat",
        "/api/chat/gemini/**",
        "/api/chat/completions/**",
        "/api/analysis/**",
        "/api/health/**",
        "/api/preparing/**"
    })
    public ResponseEntity<byte[]> proxy(
            HttpServletRequest request,
            @RequestBody(required = false) byte[] body) {

        String path = request.getRequestURI();
        String query = request.getQueryString();
        String targetUrl = fastapiBaseUrl + path + (query != null ? "?" + query : "");

        log.info("[FastApiProxy] → {} {}", request.getMethod(), targetUrl);

        HttpHeaders headers = new HttpHeaders();
        Collections.list(request.getHeaderNames()).stream()
                .filter(h -> !"host".equalsIgnoreCase(h) && !"content-length".equalsIgnoreCase(h))
                .forEach(h -> headers.add(h, request.getHeader(h)));

        HttpEntity<byte[]> entity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(
                    targetUrl,
                    HttpMethod.valueOf(request.getMethod()),
                    entity,
                    byte[].class
            );
        } catch (HttpStatusCodeException e) {
            log.warn("[FastApiProxy] {} {} → {}", request.getMethod(), path, e.getStatusCode());
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsByteArray());
        } catch (Exception e) {
            log.error("[FastApiProxy] {} {} → connection failed: {}", request.getMethod(), targetUrl, e.getMessage());
            return ResponseEntity.status(502)
                    .body(("FastAPI unavailable: " + e.getMessage()).getBytes());
        }
    }
}
