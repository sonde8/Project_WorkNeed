package com.Workneed.workneed.config;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

//자동 로그인-세션 검증을 가장 빨리해서 db에 쿠키가 남아있다면 로그인-
@Component
@RequiredArgsConstructor
public class AutoLoginInterceptor implements HandlerInterceptor {

    private final UserService userService;

    private static final String COOKIE_NAME = "autoLoginToken";
    private static final int COOKIE_AGE = 60 * 60 * 24 * 365;

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

        String token = null;
        for (Cookie cookie : cookies) {
            if ("autoLoginToken".equals(cookie.getName())) {
                token = cookie.getValue();
                break;
            }
        }
        if (token == null || token.isBlank())
            return true;


        UserDTO user = userService.findByRememberToken(token);

        // db에 없거나 만료되면 쿠키삭제
        if (user == null) {
            Cookie deleteCookie = new Cookie(COOKIE_NAME, "");
            deleteCookie.setPath("/");
            deleteCookie.setMaxAge(0);
            response.addCookie(deleteCookie);

            return true;
        }

        // 세션 복원
        HttpSession newSession = request.getSession(true);
        newSession.setAttribute("user", user);

        // 토큰 로테이트- 자동 로그인으로 들어와도 보안을 위해서 교체
        userService.clearRememberToken(user.getUserId());

        String newToken = UUID.randomUUID().toString();
        userService.saveRememberToken(user.getUserId(), newToken);

        Cookie newCookie = new Cookie(COOKIE_NAME, newToken);
        newCookie.setHttpOnly(true);
        newCookie.setPath("/");
        newCookie.setMaxAge(COOKIE_AGE);
        response.addCookie(newCookie);


        return true;
    }
}
