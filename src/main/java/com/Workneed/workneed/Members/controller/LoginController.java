package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.entity.User;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;


@Controller
@RequiredArgsConstructor
public class LoginController  {

    private final UserService userService;

    @GetMapping("/login")
    public String loginForm() {
        return "Members/login";
    }

    @PostMapping("/login/do")
    public String login(
            String loginId,
           String password,
            HttpSession session,
            Model model
    ) {
        User user = userService.login(loginId, password);

        if (user == null) {
            model.addAttribute("errorMessage", "아이디 또는 비밀번호가 올바르지 않습니다.");
            return "Members/login";
        }

        session.setAttribute("loginUser", user);
        return "redirect:/main";
    }
}
