package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class LogoutController {

    private final UserService userService;

    @PostMapping("/logout")
    public String logout(HttpSession session,
                         HttpServletResponse response) {

        UserDTO user = (UserDTO) session.getAttribute("user");

        // DB 토큰 제거
        if (user != null) {
            userService.clearRememberToken(user.getUserId());
        }

        session.invalidate(); // 세션삭제

        Cookie cookie = new Cookie("autoLoginToken", null); // name 값을 대상으로 삼아서  null
        cookie.setPath("/"); //  "/" 로 맞춰야 동일 쿠키로 인식하고 삭제 경로 다르면 안지워짐
        cookie.setMaxAge(0); //  지금 당장 만료시키라는 뜻 . 브라우저가 이 응답을 받으면 해당 쿠키 즉시 삭제
        response.addCookie(cookie);  // 응답헤더 set-Cookie 나감. 브라우저가 헤더를보고 삭제

        return "redirect:/main";
    }
}
