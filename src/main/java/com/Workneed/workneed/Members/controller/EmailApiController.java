/*
package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.service.MailService;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mail")
@RequiredArgsConstructor
public class EmailApiController {

    private final MailService mailService;
    private final UserService userService;

    // 중복된 @PostMapping("/send")가 있는지 확인하고 하나만 남기세요!
    @PostMapping("/send")
    public ResponseEntity<?> sendCode(@RequestParam("email") String email, @RequestParam("loginId") String loginId,
                                      HttpSession session) {

        // 아이디 중복 체크
        if (userService.isLoginIdExists(loginId)) {
            return ResponseEntity.badRequest().body("이미 사용 중인 아이디입니다.");
        }

        // 이메일 중복 체크
        if (userService.isEmailExists(email)) {
            return ResponseEntity.badRequest().body("이미 가입된 이메일입니다.");
        }

        //  체크 통과 시 발송
        String code = mailService.createCode();
        session.setAttribute("authCode", code);
        mailService.sendEmail(email, code);
        session.setMaxInactiveInterval(60 * 3); // 3분

        return ResponseEntity.ok("인증번호가 발송되었습니다.");
    }

    // 아이디 찾기 API 추가
    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestParam("userName") String userName,
                                    @RequestParam("email") String email) {

        // UserService에 우리가 아까 만든 findId 메서드를 호출
        String maskedId = userService.findId(userName, email);

        if (maskedId == null) {
            return ResponseEntity.badRequest().body("일치하는 정보가 없습니다.");
        }

        // 찾은 마스킹 아이디(예: ad***)를 반환
        return ResponseEntity.ok(maskedId);
    }

    @PostMapping("/find-pw")
    public ResponseEntity<?> findPw(@RequestParam("loginId") String loginId,
                                    @RequestParam("email") String email,
                                    HttpSession session) { // 1. HttpSession 파라미터 추가

        String tempPw = userService.createTempPassword(loginId, email);

        if (tempPw == null) {
            return ResponseEntity.badRequest().body("일치하는 회원 정보가 없습니다.");
        }

        try {
            String content = "회원님의 임시 비밀번호는 [" + tempPw + "] 입니다. 로그인 후 반드시 변경하세요.";
            mailService.sendEmail(email, content);

            // 2. 세션에 마킹 (이 세션에서 로그인하면 알람이 뜨게 함)
            session.setAttribute("isTempLogin", true);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("메일 발송 중 오류가 발생했습니다.");
        }

        return ResponseEntity.ok("입력하신 이메일로 임시 비밀번호를 발송했습니다.");
    }

    @PostMapping("/verify")
    public ResponseEntity<Boolean> verify(@RequestParam("code") String code,
                                          HttpSession session) {

        String savedCode = (String) session.getAttribute("authCode");

        if (savedCode == null) {
            return ResponseEntity.ok(false);
        }

        boolean result = savedCode.equals(code);

        if (result) {
            session.removeAttribute("authCode"); // 성공 시 삭제
        }

        return ResponseEntity.ok(result);
    }



}*/