package com.Workneed.workneed.Members.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;
import java.util.Map;

@Controller
public class LogoutController {

    @PostMapping("/logout")
    public String logout(HttpSession session) {

        session.invalidate(); // 세션 종료

        return "redirect:/login"; // 🔥
    }
}