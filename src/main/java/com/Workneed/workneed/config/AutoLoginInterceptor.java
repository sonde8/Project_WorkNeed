package com.Workneed.workneed.config;

import com.Workneed.workneed.Members.entity.User;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

//자동 로그인-세션 검증을 가장 빨리해서 db에 쿠키가 남아있다면 로그인-
@Component
@RequiredArgsConstructor
public class AutoLoginInterceptor implements HandlerInterceptor {

    private final UserService userService;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {

        //세션 없으면 생성 x
        HttpSession session = request.getSession(false);

        // 이미 로그인된 경우 → 아무것도 안 함
        if (session != null && session.getAttribute("user") != null) {
            return true; //유저가 존재한다면 바로 db접근 차단 -리소스 소모 최적화-
        }

        // 쿠키 확인
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return true;

        for (Cookie cookie : cookies) {
            if ("autoLoginToken".equals(cookie.getName())) {

                String token = cookie.getValue();

                // DB에서 토큰으로 사용자 조회
                User user = userService.findByRememberToken(token);

                if (user != null) {
                    // 세션 복원
                    HttpSession newSession = request.getSession(true);
                    newSession.setAttribute("user", user);
                }
                break;
            }
        }

        return true;
    }
}
