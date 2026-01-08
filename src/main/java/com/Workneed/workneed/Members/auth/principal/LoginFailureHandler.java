package com.Workneed.workneed.Members.auth.principal;

import jakarta.servlet.ServletException; // 추가
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.DisabledException; // 🚨 필수 추가
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException; // 추가

@Component
public class LoginFailureHandler implements AuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception)
            throws IOException {

        String reason = "error";

        //  직접 DisabledException인 경우
        if (exception instanceof DisabledException) {
            reason = exception.getMessage();
        }

        else if (exception.getCause() instanceof DisabledException) {
            reason = exception.getCause().getMessage();
        }

        response.sendRedirect("/login?reason=" + reason);
    }
}