package com.Workneed.workneed.Main;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    // 메인페이지
    @GetMapping("/main")
    public String Main(Model model){

        model.addAttribute("pageTitle","메인");

        return "Main/Main";
    }

}

