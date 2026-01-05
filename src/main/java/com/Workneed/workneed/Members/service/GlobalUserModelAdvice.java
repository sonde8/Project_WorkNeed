package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
public class GlobalUserModelAdvice {

    //View 중 model 에 user 자동주입
    @ModelAttribute("user")
    public UserDTO user(HttpSession session) {
        return (UserDTO) session.getAttribute("user");
    }

    @ModelAttribute("admin")
    public AdminUserDTO admin(HttpSession session) {
        return (AdminUserDTO) session.getAttribute("admin");
    }
}