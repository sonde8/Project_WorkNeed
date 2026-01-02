package com.Workneed.workneed.Calendar.controller;

import com.Workneed.workneed.config.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CalendarPageController {

    @GetMapping("/calendar")
    public String calendarPage(Model model,
                               @AuthenticationPrincipal CustomUserDetails userDetails) {
        // 로그인한 유저 정보를 모델에 담아 HTML로 전달
        if (userDetails != null && userDetails.getUserDto() != null) {
            model.addAttribute("loginUser", userDetails.getUserDto());
        }
        return "Calendar/calendar";
    }
}