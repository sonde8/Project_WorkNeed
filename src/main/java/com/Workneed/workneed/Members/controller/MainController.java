package com.Workneed.workneed.Members.controller;


import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    @GetMapping("/main")
    public String main(HttpSession session, Model model) {

        UserDTO user = (UserDTO) session.getAttribute("user");

        model.addAttribute("user", user);

        return "Members/main";
    }
}