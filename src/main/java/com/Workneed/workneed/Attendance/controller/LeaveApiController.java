package com.Workneed.workneed.Attendance.controller;

import com.Workneed.workneed.Approval.dto.LeaveRequestDTO;
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
            // ===== 기본값 보정 =====
            if (req == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 값이 없습니다");
            }

            if (req.getStartDate() == null) req.setStartDate(LocalDate.now());
            if (req.getEndDate() == null) req.setEndDate(req.getStartDate());

            // ===== LeaveApplyDTO -> LeaveRequestDTO 변환 =====
            LeaveRequestDTO dto = new LeaveRequestDTO();
            dto.setLeaveType(req.getLeaveType());     // LeaveApplyDTO.leaveType이 enum이면 그대로
            dto.setStartDate(req.getStartDate());
            dto.setEndDate(req.getEndDate());
            dto.setReason(req.getReason());

            // ===== 서비스 호출 =====
            leaveService.applyLeave(getUserId(session), dto);

            return ResponseEntity.ok().build();

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());

        } catch (RuntimeException e) {
            // 로그인 필요 등
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<LeaveSummaryDTO> summary(HttpSession session, @RequestParam int year) {
        try {
            return ResponseEntity.ok(leaveService.summary(getUserId(session), year));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<LeaveUseDTO>> list(HttpSession session, @RequestParam int year) {
        try {
            return ResponseEntity.ok(leaveService.listByYear(getUserId(session), year));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
