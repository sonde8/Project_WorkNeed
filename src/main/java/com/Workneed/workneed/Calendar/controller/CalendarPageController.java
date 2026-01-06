package com.Workneed.workneed.Calendar.controller;

import com.Workneed.workneed.Members.dto.UserDTO; // ★ Import
import jakarta.servlet.http.HttpSession; // ★ Import
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CalendarPageController {

    @Value("${google.calendar.api-key}")
    private String googleCalendarApiKey;

    @GetMapping("/calendar")
    public String calendarPage(Model model, HttpSession session) {

        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user != null) {

            model.addAttribute("loginUser", user);
        }
        model.addAttribute("googleCalendarApiKey", googleCalendarApiKey);

        return "Calendar/calendar";
    }
}