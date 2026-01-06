package com.Workneed.workneed.Main;

import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    // application.properties의 값을 주입받음
    @Value("${google.calendar.api-key}")
    private String googleCalendarApiKey;

    @GetMapping("/main")
    public String main(HttpSession session, Model model) {

        if (session.getAttribute("admin") != null) {
            return "redirect:/admin/member/list";
        }

        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }

        model.addAttribute("user", user);
        model.addAttribute("pageTitle", "메인");

        model.addAttribute("googleCalendarApiKey", googleCalendarApiKey);

        return "Main/main";
    }

}
