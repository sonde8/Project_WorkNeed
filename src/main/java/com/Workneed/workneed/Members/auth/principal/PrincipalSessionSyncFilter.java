//package com.Workneed.workneed.Members.auth.principal;
//
//import com.Workneed.workneed.Members.dto.AdminUserDTO;
//import com.Workneed.workneed.Members.dto.UserDTO;
//import com.Workneed.workneed.Members.mapper.AdminUserMapper;
//import com.Workneed.workneed.Members.mapper.UserMapper;
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import jakarta.servlet.http.HttpSession;
//import lombok.RequiredArgsConstructor;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.security.oauth2.core.oidc.user.OidcUser;
//import org.springframework.stereotype.Component;
//import org.springframework.web.filter.OncePerRequestFilter;
//
//import java.io.IOException;
//
//@Component
//@RequiredArgsConstructor
//public class PrincipalSessionSyncFilter extends OncePerRequestFilter {
//
//    private final UserMapper userMapper;
//    private final AdminUserMapper adminUserMapper;
//
//    @Override
//    protected void doFilterInternal(HttpServletRequest request,
//                                    HttpServletResponse response,
//                                    FilterChain filterChain)
//            throws ServletException, IOException {
//
//        HttpSession session = request.getSession(true);
//
//        // 이미 세션에 user/admin 있으면 재주입 금지
//        if (session.getAttribute("user") == null
//                && session.getAttribute("admin") == null) {
//
//            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//
//            if (auth != null && auth.isAuthenticated()
//                    && auth.getPrincipal() instanceof OidcUser oidcUser) {
//
//                String email = oidcUser.getEmail();
//
//                //  관리자 먼저 조회
//                AdminUserDTO admin = adminUserMapper.findByAdminEmail(email);
//                if (admin != null) {
//                    session.setAttribute("admin", admin);
//                    System.out.println("✅ session.admin injected (OIDC)");
//                } else {
//
//                    //  일반 유저 조회
//                    UserDTO user = userMapper.findByEmail(email);
//                    if (user != null) {
//                        session.setAttribute("user", user);
//                        System.out.println("✅ session.user injected (OIDC)");
//                    } else {
//                        System.out.println("❌ No matching admin/user for email=" + email);
//                    }
//                }
//            }
//        }
//
//        filterChain.doFilter(request, response);
//    }
//}
//
