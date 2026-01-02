package com.Workneed.workneed.Calendar.controller;

import com.Workneed.workneed.Members.dto.UserDTO; // ★ Import
import jakarta.servlet.http.HttpSession; // ★ Import
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CalendarPageController {

    @GetMapping("/calendar")
    public String calendarPage(Model model, HttpSession session) {

        // 세션에서 직접 꺼내기
        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user != null) {

            model.addAttribute("loginUser", user);
        }

        return "Calendar/calendar";
    }
}