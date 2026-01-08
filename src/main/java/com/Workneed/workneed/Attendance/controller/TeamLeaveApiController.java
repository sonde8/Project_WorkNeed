package com.Workneed.workneed.Attendance.controller;

import com.Workneed.workneed.Attendance.dto.LeaveTeamUseDTO;
import com.Workneed.workneed.Attendance.service.TeamLeaveService;
import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/team/leave")
public class TeamLeaveApiController {

    private final TeamLeaveService teamLeaveService;

    private Long getUserId(HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) throw new RuntimeException("로그인이 필요합니다.");
        return user.getUserId();
    }

    @GetMapping
    public List<LeaveTeamUseDTO> list(HttpSession session,
                                      @RequestParam int year,
                                      @RequestParam(required = false) String name) {

        return teamLeaveService.listDeptLeave(getUserId(session), year, name);
    }



}
