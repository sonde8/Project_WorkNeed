package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.entity.User;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;


@Controller
@RequiredArgsConstructor
public class LoginController {

    private final UserService userService;

    @GetMapping("login")
    public String loginForm(HttpSession session,
                            @RequestParam(required = false)String passwordChanged,
                            @RequestParam(required = false) String registerSuccess,
                            Model model) {

            if (session.getAttribute("user") != null) {
                return "redirect:/main";
            }

        if (passwordChanged != null) {
            model.addAttribute("infoMessage", "비밀번호가 변경되었습니다. 다시 로그인해주세요.");
        }

        if (registerSuccess != null) {
            model.addAttribute("infoMessage", "회원가입이 완료되었습니다. 로그인해주세요.");
        }

        return "Members/login";
    }

    @PostMapping("/login")
    public String login(
            String loginId,
            String password,
            HttpSession session,
            String autoLogin,  // 자동로그인
            HttpServletResponse response,
            Model model
            ) {
        if(session.getAttribute("user") != null){
            return  "redirect:/main";
        }

        //  아이디 미입력
        if (loginId == null || loginId.isBlank()) {
            model.addAttribute("loginError", "아이디를 입력하세요");
            return "Members/login";
        }

        //  비밀번호 미입력
        if (password == null || password.isBlank()) {
            model.addAttribute("loginError", "비밀번호를 입력하세요");
            return "Members/login";
        }

        //  인증 시도
        User user = userService.login(loginId, password);

        //  아이디 또는 비밀번호 불일치
        if (user == null) {
            model.addAttribute("loginError", "아이디나 비밀번호를 다시 입력하세요");
            return "Members/login";
        }

        //  로그인 성공
        session.setAttribute("user", user);

        // 자동저장 체크된 경우
        if ("on".equals(autoLogin)) {
            String token = UUID.randomUUID().toString();

            userService.saveRememberToken(user.getUserId(), token);

            Cookie cookie = new Cookie("REMEMBER_ME", token);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(60 * 60 * 24 * 7); // 7일
            response.addCookie(cookie);
        }
        return "redirect:/main";
    }
}
