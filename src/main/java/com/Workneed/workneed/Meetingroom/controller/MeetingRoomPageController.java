package com.Workneed.workneed.Meetingroom.controller;

import com.Workneed.workneed.Members.dto.UserDTO; // ★ Import
import jakarta.servlet.http.HttpSession; // ★ Import
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/meetingroom")
public class MeetingRoomPageController {

    /**
     * 회의실 현황 + 예약 모달 페이지
     */
    @GetMapping
    public String meetingRoomPage(HttpSession session, Model model) {

        // 세션에서 로그인 정보 가져와서 화면(HTML)에 전달
        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user != null) {
            model.addAttribute("loginUser", user);
        }

        return "Meetingroom/meetingroom";
    }
}