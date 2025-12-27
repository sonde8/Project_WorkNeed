package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class PasswordController {

    private final UserService userService;

    @PostMapping("/my/password/change")
    public String changePassword(HttpSession session, String currentPassword, String newPassword, String confirmPassword, Model model) {
        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user == null) {
            return "redirect:/login";
        }

        try {
            userService.changePassword(user.getUserId(), currentPassword, newPassword, confirmPassword);
            session.invalidate(); //비밀번호 변경 선공 -> 세션 종료 => 재로그인
            return "redirect:/login?password=changed";


        } catch (IllegalArgumentException e) {
            model.addAttribute("passwordChangeError", e.getMessage());
            model.addAttribute("user", user);
            return "Members/main";
        }
    }
}
