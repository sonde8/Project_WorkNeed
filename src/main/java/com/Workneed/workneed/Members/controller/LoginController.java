package com.Workneed.workneed.Members.controller;


import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.Workneed.workneed.Members.auth.principal.CustomUserDetails;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@Controller
@RequiredArgsConstructor
public class LoginController {

    private final UserService userService;


    //로그인 페이지 이동
    @GetMapping("/login")
    public String loginForm(HttpSession session, Authentication authentication,
                            @RequestParam(required = false) String reason,
                            Model model) {


        if (authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            return "redirect:/main";
        }

        // 이미 로그인된 경우
        if (reason != null) {
            switch (reason) {
                case "error":
                    model.addAttribute("loginError",
                            "아이디 또는 비밀번호가 올바르지 않습니다.");
                    break;

                case "inactive":
                    model.addAttribute("loginError",
                            "현재 휴직 또는 비활성 상태입니다. 복직/활성화 후 이용 가능합니다.");
                    break;

                case "pending":
                    model.addAttribute("infoMessage",
                            "가입 승인 대기 중입니다. 관리자가 승인한 후 서비스 이용이 가능합니다.");
                    break;

                case "suspended":
                    model.addAttribute("loginError",
                            "계정이 일시적으로 정지되었습니다. 관리자에게 문의해주세요.");
                    break;

                case "banned":
                    model.addAttribute("loginError",
                            "계정 이용이 제한되었습니다.");
                    break;

                case "register":
                    model.addAttribute("infoMessage",
                            "회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.");
                    break;

                case "passwordChanged":
                    model.addAttribute("infoMessage",
                            "비밀번호가 변경되었습니다. 다시 로그인해주세요.");
                    break;
            }
        }

        return "Members/login";
    }

}