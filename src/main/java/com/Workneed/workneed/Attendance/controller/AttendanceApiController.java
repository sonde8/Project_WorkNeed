package com.Workneed.workneed.Attendance.controller;

import com.Workneed.workneed.Attendance.dto.AttendanceBookDTO;
import com.Workneed.workneed.Attendance.dto.AttendanceResponseDTO;
import com.Workneed.workneed.Attendance.dto.TeamAttendRowDTO;
import com.Workneed.workneed.Attendance.service.AttendanceService;
import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/attendance")
public class AttendanceApiController {

    private final AttendanceService attendanceService;

    private Long getEmpId(HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) throw new RuntimeException("로그인이 필요합니다.");
        return user.getUserId();
    }

    // 출근
    @PostMapping("/checkin")
    public void checkIn(HttpSession session) {
        attendanceService.checkIn(getEmpId(session));
    }

    // 퇴근
    @PostMapping("/checkout")
    public void checkOut(HttpSession session) {
        attendanceService.checkOut(getEmpId(session));
    }

    // 누적
    @GetMapping("/summary")
    public AttendanceResponseDTO summary(HttpSession session) {
        return attendanceService.summary(getEmpId(session));
    }

    // 출근부
    @GetMapping("/book")
    public List<AttendanceBookDTO> book(HttpSession session,
                                        @RequestParam int year,
                                        @RequestParam int month) {

        return attendanceService.book(getEmpId(session), year, month);
    }

    // 자동 퇴근 경우
    @GetMapping("/auto")
    public Map<String, Object> autoNotice(HttpSession session) {

        Long empId = getEmpId(session);

        Boolean show = attendanceService.checkoutYesterdayAuto(empId);

        return Map.of("show", show);
    }

    // 자동 퇴근 -> 알림
    @PostMapping("/auto/notice")
    public void noticeAuto(HttpSession session) {

        Long empId = getEmpId(session);

        attendanceService.checkoutNotice(empId);
    }

    // 팀 근태
    @GetMapping("/attendTeam")
    public List<TeamAttendRowDTO> teamAttend(HttpSession session,
                                             @RequestParam int year,
                                             @RequestParam int month) {
        Long empId = getEmpId(session);

        return attendanceService.teamAttend(empId, year, month);
    }
}
