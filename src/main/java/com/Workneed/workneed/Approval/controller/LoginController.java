package com.Workneed.workneed.Approval.controller;

import com.Workneed.workneed.Approval.entity.User;
import com.Workneed.workneed.Approval.service.LoginService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/approval")
public class LoginController {
    private final LoginService service;
    @Autowired
    public LoginController(LoginService service) {
        this.service = service;
    }

    //화면
    @GetMapping("/login")
    public String login(){
        return "Approval/login";
    }

    //로구인처리
    @PostMapping("/login")
    public String login(@RequestParam String loginId,
                        @RequestParam String password,
                        HttpSession session,
                        Model model){

        User user = service.login(loginId, password);
        if (user == null) {
            model.addAttribute("error", "아이디 또는 비밀번호가 올바르지 않습니다.");
            return "Approval/login";
        }

        // ✅ 결재 시스템의 기준 키
        session.setAttribute("userId", user.getUserId());
        session.setAttribute("loginId", user.getLoginId());
        session.setAttribute("loginUserName", user.getUserName());
        System.out.println("LOGIN OK sessionId=" + session.getId() + ", userId=" + session.getAttribute("userId"));

        return "redirect:/approval/create";
    }


}
