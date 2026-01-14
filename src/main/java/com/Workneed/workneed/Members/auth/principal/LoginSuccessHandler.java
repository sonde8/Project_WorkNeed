package com.Workneed.workneed.Members.auth.principal;


import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import com.Workneed.workneed.Members.mapper.UserMapper;
import com.Workneed.workneed.Members.service.AdminUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
// 사용자의 관리자/유저/소셜로그인 인지 판별해서 세션에 필요한 정보 주입 및 맞는 페이지로 보내주는 핸들러
@Component
@RequiredArgsConstructor
public class LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserMapper userMapper;
    private final AdminUserMapper adminUserMapper;
    private final AdminUserService adminUserService;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        // 로그인 전에 가려고했던 주소 삭제-메인으로 깔끔히 보내기위함-
        RequestCache requestCache = new HttpSessionRequestCache();
        requestCache.removeRequest(request, response);

        HttpSession session = request.getSession(true);
        Object principal = authentication.getPrincipal();

        // 1)  커스텀 principal
        if (principal instanceof CustomUserDetails cud) {
            if (cud.getAdminDto() != null) {
                // 관리자 로그인 시 시간을 db에 기록
                adminUserService.updateLoginTime(cud.getAdminDto().getAdminId());
                // 관리자라면 유저세션 삭제 후 관리자로 세션주입
                
                session.setAttribute("admin", cud.getAdminDto());
                session.removeAttribute("user");
                response.sendRedirect("/main");
                return;
                
                
            }

            // 활성화 된 유저라면 세션주입후 메인리다이렉트 , 그 외에는 에러메시지
            UserDTO user = cud.getUserDto();
            switch (user.getUserStatus()) {
                case "ACTIVE":
                    session.setAttribute("user", user);
                    response.sendRedirect("/main");
                    return;

                case "INACTIVE":
                    response.sendRedirect("/login?reason=inactive");
                    return;

                case "SUSPENDED":
                    response.sendRedirect("/login?reason=suspended");
                    return;

                case "BANNED":
                    response.sendRedirect("/login?reason=banned");
                    return;
            }

            session.setAttribute("user", user);
            session.removeAttribute("admin");
            response.sendRedirect("/main");
            return;
        }

        // 2) 구글 OIDC 기본 principal (DefaultOidcUser)
        if (principal instanceof org.springframework.security.oauth2.core.oidc.user.OidcUser oidcUser) {
            String email = oidcUser.getEmail();
            if (email == null) {
                SecurityContextHolder.clearContext();
                session.invalidate();
                response.sendRedirect("/login?error");
                return;
            }

            // 관리자 먼저
            AdminUserDTO admin = adminUserMapper.findByAdminEmail(email);
            if (admin != null) {
                if (!"ACTIVE".equals(admin.getAdminStatus())) {
                    SecurityContextHolder.clearContext();
                    session.invalidate();
                    response.sendRedirect("/login?error");
                    return;
                }

                //  관리자 로그인 시각 업데이트
                adminUserService.updateLoginTime(admin.getAdminId());

                session.setAttribute("admin", admin);
                session.removeAttribute("user");
                response.sendRedirect("/admin/member/list");
                return;
            }

            // 일반 유저
            UserDTO user = userMapper.findByEmail(email);
            if (user == null || !"ACTIVE".equals(user.getUserStatus())) {
                SecurityContextHolder.clearContext();
                session.invalidate();
                response.sendRedirect("/login?needApproval=true");
                return;
            }

            session.setAttribute("user", user);
            session.removeAttribute("admin");
            response.sendRedirect("/main");
            return;
        }

        // 3) 혹시 OIDC 아닌 OAuth2User로 들어온 경우 (보험)
        if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User oauthUser) {
            // 소셜 에서 보내준 모든 데이터를 map(키-값)으로저장
            Map<String, Object> attrs = oauthUser.getAttributes();
           // 그 중에서 이메일만 찾아내고 만약 없다면 세선강제종료
            String email = (attrs != null) ? (String) attrs.get("email") : null;

            if (email == null) {
                SecurityContextHolder.clearContext();
                session.invalidate();
                response.sendRedirect("/login?error");
                return;
            }

            // 관리자 우선검증(만약 이메일이 관리자와 겹친다면 관리자 이메일을 찾고 세션에 관리자 바로주입)
            AdminUserDTO admin = adminUserMapper.findByAdminEmail(email);
            if (admin != null) {
                session.setAttribute("admin", admin);
                session.removeAttribute("user");
                response.sendRedirect("/admin/member/list");
                return;
            }

            // 유저의 값과 상태가 액티브일 때만 로그인 가능
            UserDTO user = userMapper.findByEmail(email);
            if (user == null || !"ACTIVE".equals(user.getUserStatus())) {
                SecurityContextHolder.clearContext();
                session.invalidate();
                response.sendRedirect("/login?needApproval=true");
                return;
            }
            session.setAttribute("user", user);
            session.removeAttribute("admin");
            response.sendRedirect("/main");
            return;
        }
    }
}