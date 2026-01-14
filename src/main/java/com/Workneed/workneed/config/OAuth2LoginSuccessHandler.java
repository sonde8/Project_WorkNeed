package com.Workneed.workneed.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

// 소셜 로그인 성공시 사용되는 핸들러
@Component
public class OAuth2LoginSuccessHandler
        implements AuthenticationSuccessHandler {

    //소셜 로그인 시 세 가지 객체전달받음
    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        // 구글/카카오 인증 완료 → 스프링 시큐리티 내부 처리 완료 → onAuthenticationSuccess 호출 → 브라우저에 메인리다이렉트
        response.sendRedirect("/main");
    }
}