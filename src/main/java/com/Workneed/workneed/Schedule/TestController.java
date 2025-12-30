package com.Workneed.workneed.Schedule;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TestController {

    @GetMapping("/test/layout")
    public String testLayout(Model model) {
        model.addAttribute("pageTitle", "Layout Test");
        return "layout/layout";
    }
}

