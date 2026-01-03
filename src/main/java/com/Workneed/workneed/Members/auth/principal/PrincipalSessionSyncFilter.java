package com.Workneed.workneed.Members.auth.principal;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

//현재  pricipal 에서  user로 못 넣어줘 딱 한번 넣어줘서 연결끊기상황을 막아ㅈ
@Component
public class PrincipalSessionSyncFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        if (uri.startsWith("/oauth2/")
                || uri.startsWith("/login")
                || uri.startsWith("/register")) {

            filterChain.doFilter(request, response);
            return;
        }

        HttpSession session = request.getSession(false);

        if (session != null && session.getAttribute("user") == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            if (auth != null && auth.isAuthenticated()
                    && auth.getPrincipal() instanceof CustomUserDetails cud) {

                // 관리자 로그인
                if (cud.getAdminDto() != null) {
                    session.setAttribute("admin", cud.getAdminDto());
                    session.removeAttribute("user");
                }

                // 일반 로그인
                else if (cud.getUserDto() != null) {
                    session.setAttribute("user", cud.getUserDto());
                    session.removeAttribute("admin");
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
