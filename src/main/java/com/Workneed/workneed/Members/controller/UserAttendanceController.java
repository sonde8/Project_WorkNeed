package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.AttendanceRequestCreateDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.AttendanceRequestService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserAttendanceController {

    private final AttendanceRequestService attendanceRequestService;

    @PostMapping("/attendance/request")
    @ResponseBody
    public String createAttendanceRequest(
            @RequestBody AttendanceRequestCreateDTO dto,
            HttpSession session) {

        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return "fail";

        attendanceRequestService.create(user.getUserId(), dto);
        return "success";
    }
}
