package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;


@Controller
@RequiredArgsConstructor
public class LoginController {

    public static final String AUTO_LOGIN_COOKIE = "autoLoginToken";
    public static final int AUTO_LOGIN_DAYS = 365;

    private final UserService userService;


    @GetMapping("/login")
    public String loginForm(HttpSession session,
                            @RequestParam(required = false) String passwordChanged,
                            @RequestParam(required = false) String registerSuccess,
                            Model model) {

        if (session.getAttribute("user") != null) {
            return "redirect:/main";
        }

        if (passwordChanged != null) {
            model.addAttribute("infoMessage", "비밀번호가 변경되었습니다. 다시 로그인해주세요.");
        }

        if (registerSuccess != null) {
            model.addAttribute("infoMessage", "회원가입이 완료되었습니다. 로그인해주세요.");
        }

        return "Members/login";
    }

    @PostMapping("/login")
    public String login(
            String loginId,
            String password,
            String autoLogin,  // 자동로그인
            HttpSession session,
            HttpServletResponse response,
            Model model
    ) {
        if (session.getAttribute("user") != null) {
            return "redirect:/main";
        }

        //  아이디 미입력
        if (loginId == null || loginId.isBlank()) {
            model.addAttribute("loginError", "아이디를 입력하세요");
            return "Members/login";
        }

        //  비밀번호 미입력
        if (password == null || password.isBlank()) {
            model.addAttribute("loginError", "비밀번호를 입력하세요");
            return "Members/login";
        }

        //  인증 시도
        UserDTO user = userService.login(loginId, password);

        //  아이디 또는 비밀번호 불일치
        if (user == null) {
            model.addAttribute("loginError", "아이디나 비밀번호를 다시 입력하세요");
            return "Members/login";
        }

        //  로그인 성공-세션사용
        session.setAttribute("user", user);

        // 자동저장 체크된 경우
        if ("on".equals(autoLogin)) {

            userService.clearRememberToken(user.getUserId());   // 1 기존 토큰 무효화

            String token = UUID.randomUUID().toString();    //새 토큰 발급

            //토큰 db저장- service내 메서드가 내부 sql쿼리문 실행
            userService.saveRememberToken(user.getUserId(), token);

            Cookie cookie = new Cookie("REMEMBER_ME", token);   //쿠키생성
            cookie.setHttpOnly(true);        //httpOnly 설정 : js접근불가 , xss 차단
            cookie.setPath("/");
            cookie.setMaxAge(60 * 60 * 24 * 365); // 1년
            response.addCookie(cookie);     //쿠키를 응답시켜 보내면 브라우저에서 쿠키저장
        }
        return "redirect:/main";
    }
}
