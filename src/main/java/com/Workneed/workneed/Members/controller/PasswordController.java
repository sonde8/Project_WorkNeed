package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

//사용자의 보안을 위해 기존 비밀번호를 검증하고 새로운 비밀번호로 교체한 뒤, 세션을 초기화하여 보안을 재정립하는 비밀번호 교체
@Controller
@RequiredArgsConstructor
public class PasswordController {

    private final UserService userService;

    //세션기반으로 가입안된 사용자는 로그인 화면 반환 
    @GetMapping("/password/change")
    public String showPasswordChangePage(HttpSession session, Model model) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }

        // 비밀번호 바꾸고 성공 시 세션 삭제하여 재로그인 시킴
        String errorMsg = (String) session.getAttribute("passwordChangeError");
        if (errorMsg != null) {
            model.addAttribute("passwordChangeError", true);
            model.addAttribute("errorDetail", errorMsg);
            session.removeAttribute("passwordChangeError");
        }

        return "layout/passwordChange";
    }

    // 비밀번호 변경로직 실행
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
            // 실패 시 메시지를 세션에 담고 다시 페이지로 보냄
            session.setAttribute("passwordChangeError", e.getMessage());
            return "redirect:/password/change"; // 실패 시 다시 변경 페이지로 리다이렉트
        }
    }
}