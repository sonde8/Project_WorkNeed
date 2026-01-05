package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
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
    public String loginForm(HttpSession session,
                            @RequestParam(required = false) String error, // 시큐리티 로그인 실패 시 넘어옴
                            @RequestParam(required = false) String passwordChanged,
                            @RequestParam(required = false) String registerSuccess,
                            @RequestParam(required = false) String needApproval,
                            Model model) {

        // 이미 로그인된 세션이 있다면 메인으로 보냄
        if (session.getAttribute("user") != null
                || session.getAttribute("admin") != null) {
            return "redirect:/main";
        }

        // 로그인 에러 메시지 처리 (시큐리티 로그인 실패 시 자동으로 ?error 파라미터가 붙음)
        if (error != null) {
            model.addAttribute("loginError", "아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        if (passwordChanged != null) {
            model.addAttribute("infoMessage", "비밀번호가 변경되었습니다. 다시 로그인해주세요.");
        }

        if (needApproval != null) {
            model.addAttribute("needApproval", true);
        }


        if (registerSuccess != null) {
            model.addAttribute("infoMessage", "회원가입이 완료되었습니다. 로그인해주세요.");
        }

        return "Members/login";
    }

}