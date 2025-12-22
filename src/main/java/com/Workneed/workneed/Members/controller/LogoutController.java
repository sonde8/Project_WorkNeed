package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.entity.User;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class LogoutController {

        @PostMapping("/logout")
        public String logout(HttpSession session) {
            session.invalidate(); //
            return "redirect:/main";
        }
}
