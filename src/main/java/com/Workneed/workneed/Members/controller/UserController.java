package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.entity.User;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;


@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/register")
    public String registerForm(Model model) {
        model.addAttribute("user", new User());
        return "Members/register";
    }


    // 회원가입 처리
    @PostMapping("/register")
    public String register(User user, Model model) {

        if (user.getUserLoginId() == null || user.getUserLoginId().isBlank()) {
            model.addAttribute("errorMessage", "아이디는 필수입니다.");
            return "Members/register";
        }

        if (user.getUserEmail() == null || user.getUserEmail().isBlank()) {
            model.addAttribute("errorMessage", "이메일은 필수입니다.");
            return "Members/register";
        }

        if (user.getUserPassword() == null || user.getUserPassword().isBlank()) {
            model.addAttribute("errorMessage", "비밀번호는 필수입니다.");
            return "Members/register";
        }

        if (user.getUserName() == null || user.getUserName().isBlank()) {
            model.addAttribute("errorMessage", "이름은 필수입니다.");
            return "Members/register";
        }

        if (user.getUserBirthday() == null) {
            model.addAttribute("errorMessage", "생년월일은 필수입니다.");
            return "Members/register";
        }


        user.setDeptId(5L);   // 배치전
        user.setRankId(1L);  // 사원

        try {
            userService.register(user);
            return "redirect:/login";

        } catch (IllegalStateException e) {

            if ("DUPLICATE_LOGIN_ID".equals(e.getMessage())) {
                model.addAttribute("errorMessage", "이미 사용 중인 아이디입니다.");
            } else if ("DUPLICATE_EMAIL".equals(e.getMessage())) {
                model.addAttribute("errorMessage", "이미 사용 중인 이메일입니다.");
            } else {
                model.addAttribute("errorMessage", "회원가입 중 오류가 발생했습니다.");
            }

            return "Members/register";
        }

    }


    //로그인된 유저 비밀번호 변경
    @PostMapping("/my/password/change")
    public String changePassword(
            @RequestParam String currentPassword,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword,
            HttpSession session,
            RedirectAttributes redirectAttributes
    ) {

        // 1. 로그인 체크
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser == null) {
            return "redirect:/login";
        }

        try {
            // 2. 비밀번호 변경 처리
            userService.changePassword(
                    loginUser.getUserId(),
                    currentPassword,
                    newPassword,
                    confirmPassword
            );

            // 3. 성공 → 로그아웃
            session.invalidate();

            // 4. 성공 메시지 (로그인 페이지에서 사용)
            redirectAttributes.addFlashAttribute(
                    "passwordChangeSuccess",
                    true
            );

            return "redirect:/login";

        } catch (IllegalArgumentException e) {

            // 5. 실패 → 에러 메시지 전달
            redirectAttributes.addFlashAttribute(
                    "passwordChangeError",
                    e.getMessage()
            );

            return "redirect:/main";
        }
    }

     //아이디찾기
    @PostMapping("/find/id")
    public String findUserId(
            @RequestParam String userName,
            @RequestParam String userEmail,
            Model model
    ) {

        User user = userService.findByNameAndEmail(userName, userEmail);

        if (user == null) {
            model.addAttribute("errorMessage", "일치하는 회원 정보가 없습니다.");
            return "Members/find_id";
        }

        // 이메일 찾아서 보내기
        model.addAttribute("foundUserId", user.getUserLoginId());

        return "Members/find_id_result";
    }

    }






