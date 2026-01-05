package com.Workneed.workneed.Members.auth.principal;

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

        HttpSession session = request.getSession(true);
        Object principal = authentication.getPrincipal();

        // 1)  커스텀 principal
        if (principal instanceof CustomUserDetails cud) {
            if (cud.getAdminDto() != null) {

                adminUserService.updateLoginTime(cud.getAdminDto().getAdminId());

                session.setAttribute("admin", cud.getAdminDto());
                session.removeAttribute("user");
                response.sendRedirect("/main");
                return;
            }

            UserDTO user = cud.getUserDto();
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
                response.sendRedirect("/main");
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
            Map<String, Object> attrs = oauthUser.getAttributes();
            String email = (attrs != null) ? (String) attrs.get("email") : null;

            if (email == null) {
                SecurityContextHolder.clearContext();
                session.invalidate();
                response.sendRedirect("/login?error");
                return;
            }

            AdminUserDTO admin = adminUserMapper.findByAdminEmail(email);
            if (admin != null) {
                session.setAttribute("admin", admin);
                session.removeAttribute("user");
                response.sendRedirect("/main");
                return;
            }

            UserDTO user = userMapper.findByEmail(email);
            if (user == null || !"ACTIVE".equals(user.getUserStatus())) {
                SecurityContextHolder.clearContext();
                session.invalidate();
                response.sendRedirect("/login?needApproval=true");
                return;
            }

            session.setAttribute("user", user);
            session.removeAttribute("admin");
        }
    }
}