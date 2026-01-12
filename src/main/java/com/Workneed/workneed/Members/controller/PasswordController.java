package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class PasswordController {

    private final UserService userService;


    @GetMapping("/password/change")
    public String showPasswordChangePage(HttpSession session, Model model) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }


        String errorMsg = (String) session.getAttribute("passwordChangeError");
        if (errorMsg != null) {
            model.addAttribute("passwordChangeError", true);
            model.addAttribute("errorDetail", errorMsg);
            session.removeAttribute("passwordChangeError");
        }

        return "layout/passwordChange"; // templates/password/change.html
    }

    @PostMapping("/my/password/change")
    public String changePassword(HttpSession session, String currentPassword,
                                 String newPassword, String confirmPassword, Model model) {
        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user == null) {
            return "redirect:/login";
        }

        try {
            userService.changePassword(user.getUserId(), currentPassword, newPassword, confirmPassword);
            session.invalidate(); // 성공 시 세션 무효화
            return "redirect:/login?password=changed";
        } catch (IllegalArgumentException e) {
            // 실패 시 메시지를 세션에 담고 다시 페이지로 보냅니다.
            session.setAttribute("passwordChangeError", e.getMessage());
            return "redirect:/password/change"; // 실패 시 다시 변경 페이지로 보내는 게 좋습니다.
        }
    }
}