package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.auth.principal.CustomUserDetails;
import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.io.IOException;


@ControllerAdvice
public class GlobalUserModelAdvice {

    @ModelAttribute("user")
    public UserDTO user(HttpSession session, HttpServletResponse response) throws IOException { // throws 추가
        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails cud) {
                user = cud.getUserDto();

                if (user != null) {
                    //
                    if (!"ACTIVE".equals(user.getUserStatus())) {
                        SecurityContextHolder.clearContext();
                        session.invalidate();

                        String status = user.getUserStatus();
                        String reason = "inactive";

                        if ("INACTIVE".equals(status)) {
                            reason = "pending";
                        } else {
                            reason = status.toLowerCase();
                        }

                        response.sendRedirect("/login?reason=" + reason);
                        return null;
                    }
                    session.setAttribute("user", user);
                }
            }
        }
        return user;
    }

    @ModelAttribute("admin")
    public AdminUserDTO admin(HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");

        // 🔍 관리자 세션 복구 로직 추가
        if (admin == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails cud) {
                admin = cud.getAdminDto();
                if (admin != null) {
                    session.setAttribute("admin", admin);
                }
            }
        }
        return admin;
    }
}