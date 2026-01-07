package com.Workneed.workneed.Attendance.controller;

import com.Workneed.workneed.Attendance.dto.LeaveApplyDTO;
import com.Workneed.workneed.Attendance.dto.LeaveSummaryDTO;
import com.Workneed.workneed.Attendance.dto.LeaveUseDTO;
import com.Workneed.workneed.Attendance.service.LeaveService;
import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.http.ResponseEntity.ok;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/leave")
public class LeaveApiController {

    private final LeaveService leaveService;

    private Long getUserId(HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) throw new RuntimeException("로그인이 필요합니다.");
        return user.getUserId();
    }

    @PostMapping("/apply")
    public ResponseEntity<?> apply(HttpSession session, @RequestBody LeaveApplyDTO req) {

        try {
            // 기본값 보정(혹시 null이면)
            if (req.getStartDate() == null) req.setStartDate(LocalDate.now());
            if (req.getEndDate() == null) req.setEndDate(req.getStartDate());

            leaveService.applyLeave(getUserId(session), req);
            return ResponseEntity.ok().build();

        } catch (IllegalArgumentException e){

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/summary")
    public LeaveSummaryDTO summary(HttpSession session, @RequestParam int year) {
        return leaveService.summary(getUserId(session), year);
    }

    @GetMapping("/list")
    public List<LeaveUseDTO> list(HttpSession session, @RequestParam int year) {
        return leaveService.listByYear(getUserId(session), year);
    }
}
