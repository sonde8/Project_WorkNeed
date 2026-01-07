package com.Workneed.workneed.Main;

import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    // 메인페이지
    @GetMapping("/main")
    public String Main(HttpSession session, Model model){

        UserDTO user = (UserDTO) session.getAttribute("user");
        model.addAttribute("user", user);

        model.addAttribute("pageTitle","메인");

        return "Main/main";
    }

}

