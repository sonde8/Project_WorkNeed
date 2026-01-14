package com.Workneed.workneed.Members.auth.principal;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

// 로그인 실패 시 원인분석해서 reason 반환
@Component
public class LoginFailureHandler implements AuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception)
            throws IOException {

        String reason = "error";

        if (exception instanceof OAuth2AuthenticationException oauthEx) {
            // 서비스에서 OAuth2Error의 description에 담은 값을 가져옴
            reason = oauthEx.getError().getDescription();

            // 만약 description이 null이면 에러 코드라도 가져옴
            if (reason == null) {
                reason = oauthEx.getError().getErrorCode();
            }
            // 실패 원인이 비활성계정 때문인지 확인
        } else if (exception instanceof DisabledException) {
            reason = exception.getMessage();
            // 마지막으로 무엇이 원인인지 한번 더 확인
        } else if (exception.getCause() instanceof DisabledException) {
            reason = exception.getCause().getMessage();
        }

        response.sendRedirect("/login?reason=" + reason);
    }
}