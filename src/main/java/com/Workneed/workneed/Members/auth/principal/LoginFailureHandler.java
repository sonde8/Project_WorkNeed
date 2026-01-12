package com.Workneed.workneed.Members.auth.principal;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException; // 🚨 필수 추가
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

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
        } else if (exception instanceof DisabledException) {
            reason = exception.getMessage();
        } else if (exception.getCause() instanceof DisabledException) {
            reason = exception.getCause().getMessage();
        }

        // 이제 "로그인 실패 사유 리다이렉트: suspended" 가 정상적으로 출력될 것입니다.
        System.out.println("로그인 실패 사유 리다이렉트: " + reason);

        response.sendRedirect("/login?reason=" + reason);
    }
}