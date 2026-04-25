package kr.hi.matey.controller;

import java.io.IOException;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import kr.hi.matey.config.AppProperties;
import kr.hi.matey.service.OAuthLoginService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/oauth2")
public class OAuthController {

    private final OAuthLoginService oAuthLoginService;
    private final AppProperties appProperties;

    @GetMapping("/{provider}")
    public void redirect(@PathVariable String provider,
                         HttpServletResponse response) throws IOException {
        String url = oAuthLoginService.buildAuthorizeUrl(provider);
        response.sendRedirect(url);
    }

    @GetMapping("/callback/{provider}")
    public void callback(@PathVariable String provider,
                         @RequestParam String code,
                         @RequestParam(required = false) String state,
                         HttpServletResponse response,
                         HttpSession session) throws IOException {
        // state/프로바이더 검증 실패 시 500 말고 로그인 쪽으로 돌리기(프론트에서 ?error=oauth 쓰면 됨)
        try {
            String redirectUrl = oAuthLoginService.login(provider, code, state, session);
            response.sendRedirect(redirectUrl);
        } catch (IllegalArgumentException e) {
            String base = appProperties.getFrontendUrl();
            if (base == null || base.isBlank()) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
                return;
            }
            response.sendRedirect(base.replaceAll("/$", "") + "/login?error=oauth");
        }
    }
}