package com.Workneed.workneed.Attendance.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AttendanceController {

    // 근태관리 메인
    @GetMapping("/attendance")
    public String attendanceMain(Model model){

        model.addAttribute("pageTitle","근태관리");

        return "Attendance/attendanceMain";
    }

    // 근태관리 -> 출석부
    @GetMapping("/attendance/month")
    public String attendanceBook(Model model){

        model.addAttribute("pageTitle", "출석부");

        return "Attendance/attendanceBook";
    }

    // 근태관리 -> 연차관리
    @GetMapping("/attendance/leave")
    public String attendanceLeave(Model model){

        model.addAttribute("pageTitle", "연차관리");

        return "Attendance/attendanceLeave";
    }

    // 근태관리 -> 부서근태현황
    @GetMapping("/attendance/teamAttend")
    public String attendanceTeamAttend(Model model){

        model.addAttribute("pageTitle", "부서근태관리");

        return "Attendance/attendanceTeamAttend";
    }

    // 근태관리 -> 부서연차현황
    @GetMapping("/attendance/teamLeave")
    public String attendanceTeamLeave(Model model){

        model.addAttribute("pageTitle", "부서연차관리");

        return "Attendance/attendanceTeamLeave";
    }
}
