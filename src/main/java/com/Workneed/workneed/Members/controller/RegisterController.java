package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.entity.User;
import com.Workneed.workneed.Members.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class RegisterController {

    private final UserService userService;

    @GetMapping("/register")
    public String registerForm(Model model) {
        model.addAttribute("user", new User());
        return "Members/register";
    }

    //회원가입
    @PostMapping("/register")
    public String register(User user, Model model) {

        // 필수값 검증 (Controller 책임)
        if (user.getUserLoginId() == null || user.getUserLoginId().isBlank()
                || user.getUserPassword() == null || user.getUserPassword().isBlank()
                || user.getUserName() == null || user.getUserName().isBlank()
                || user.getUserBirthday() == null) {

            model.addAttribute("errorMessage", "정보를 입력해주세요.");
            model.addAttribute("user", user);
            return "Members/register";
        }

        try {
            userService.register(user);
            // 성공만 redirect
            return "redirect:/login?signup=success";

        } catch (IllegalStateException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("user", user);
            return "Members/register";
        }
    }
}
