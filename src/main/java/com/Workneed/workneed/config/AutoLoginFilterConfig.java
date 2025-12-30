package com.Workneed.workneed.config;

import com.Workneed.workneed.Members.service.UserService;
import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
public class AutoLoginFilterConfig {

    private final UserService userService;

    // @Lazy를 사용하여 UserService와의 순환 참조를 방지합니다.
    public AutoLoginFilterConfig(@Lazy UserService userService) {
        this.userService = userService;
    }

    @Bean
    public OncePerRequestFilter autoLoginFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {

                HttpSession session = request.getSession(false);

                // 세션에 유저가 없는 경우에만 자동 로그인 시도
                if (session == null || session.getAttribute("user") == null) {
                    Cookie[] cookies = request.getCookies();
                    if (cookies != null) {
                        for (Cookie cookie : cookies) {
                            if ("autoLoginToken".equals(cookie.getName())) {
                                String token = cookie.getValue();
                                UserDTO user = userService.findByRememberToken(token);

                                if (user != null) {
                                    request.getSession().setAttribute("user", user);
                                }
                            }
                        }
                    }
                }
                // 다음 필터로 진행
                filterChain.doFilter(request, response);
            }
        };
    }
}