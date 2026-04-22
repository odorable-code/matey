package kr.hi.matey.controller;

import java.io.IOException;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;
import kr.hi.matey.service.OAuthLoginService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/oauth2")
public class OAuthController {

    private final OAuthLoginService oAuthLoginService;

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
                         HttpServletResponse response) throws IOException {
        String redirectUrl = oAuthLoginService.login(provider, code, state);
        response.sendRedirect(redirectUrl);
    }
}