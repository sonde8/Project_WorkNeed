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
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import lombok.RequiredArgsConstructor;

import java.io.IOException;


// 로그인 후에도 실시간으로 유저의 상태를 확인 후 처리
@ControllerAdvice
@RequiredArgsConstructor
public class GlobalUserModelAdviceService {

    private final AdminUserMapper adminUserMapper;

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
                        String reason = "pending";

                        // 가입일이 30일 넘었을 때만 inactive로 바꿈
                        if (user.getUserCreatedAt() != null) {
                            long days = java.time.temporal.ChronoUnit.DAYS.between(user.getUserCreatedAt(), java.time.LocalDate.now());
                            if (days >= 30) {
                                reason = "inactive";
                            }
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
    public AdminUserDTO admin(HttpSession session, HttpServletResponse response) throws IOException {

        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud)) {
            return admin;
        }

        AdminUserDTO loginAdmin = cud.getAdminDto();
        if (loginAdmin == null) return admin;

        // DB 최신 상태 재조회
        AdminUserDTO latest = adminUserMapper.findByAdminId(loginAdmin.getAdminId());

        // ACTIVE 아니면 즉시 튕김
        if (latest == null || !"ACTIVE".equals(latest.getAdminStatus())) {
            SecurityContextHolder.clearContext();
            session.invalidate();
            response.sendRedirect("/login?reason=suspended");
            return null;
        }

        // ACTIVE면 세션 최신화
        session.setAttribute("admin", latest);
        return latest;
    }
}