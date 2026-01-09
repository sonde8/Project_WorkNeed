package com.Workneed.workneed.Attendance.controller;

import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AttendanceController {

    // 권한
    private boolean teamOwner(HttpSession session) {

        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return false;

        Long rankId = user.getRankId();

        return rankId != null && rankId.equals(4L);
    }

    // 근태관리 메인
    @GetMapping("/attendance")
    public String attendanceMain(Model model, HttpSession session) {

        model.addAttribute("pageTitle","근태관리");
        model.addAttribute("teamOwner", teamOwner(session));

        return "Attendance/attendanceMain";
    }

    // 근태관리 -> 출석부
    @GetMapping("/attendance/month")
    public String attendanceBook(Model model, HttpSession session) {

        model.addAttribute("pageTitle", "출석부");
        model.addAttribute("teamOwner", teamOwner(session));

        return "Attendance/attendanceBook";
    }

    // 근태관리 -> 연차관리
    @GetMapping("/attendance/leave")
    public String attendanceLeave(Model model , HttpSession session) {

        model.addAttribute("pageTitle", "연차관리");
        model.addAttribute("teamOwner", teamOwner(session));

        return "Attendance/attendanceLeave";
    }

    // 근태관리 -> 부서근태현황
    @GetMapping("/attendance/teamAttend")
    public String attendanceTeamAttend(Model model, HttpSession session){

        if(!teamOwner(session)) return "redirect:/attendance";

        model.addAttribute("pageTitle", "부서근태관리");
        model.addAttribute("teamOwner", teamOwner(session));

        return "Attendance/attendanceTeamAttend";
    }

    // 근태관리 -> 부서연차현황
    @GetMapping("/attendance/teamLeave")
    public String attendanceTeamLeave(Model model, HttpSession session){

        if(!teamOwner(session)) return "redirect:/attendance";

        model.addAttribute("pageTitle", "부서연차관리");
        model.addAttribute("teamOwner", teamOwner(session));

        return "Attendance/attendanceTeamLeave";
    }

}
