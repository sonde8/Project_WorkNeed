package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.entity.User;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    @GetMapping("/main")
    public String main(HttpSession session, Model model) {

        // 로그인 안 됐으면 무조건 로그인으로
        if (session == null || session.getAttribute("loginUser") == null) {
            return "redirect:/login";
        }

        User loginUser = (User) session.getAttribute("loginUser");

        if (loginUser != null) {
            model.addAttribute("isLogin", true);
            model.addAttribute("loginUser", loginUser);
        } else {
            model.addAttribute("isLogin", false);
        }

        return "Members/main";
    }
}
