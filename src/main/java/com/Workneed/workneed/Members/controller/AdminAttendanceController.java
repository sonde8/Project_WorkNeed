package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.RequestDTO;
import com.Workneed.workneed.Members.service.AttendanceAdminQueryService;
import com.Workneed.workneed.Members.service.AttendanceApproveService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

// 관리자가 유저의 근태요청 심사하는 컨트롤러
@Controller
@RequiredArgsConstructor
public class AdminAttendanceController {

    private final AttendanceAdminQueryService attendanceAdminQueryService;
    private final AttendanceApproveService attendanceApproveService;

    // 🔹 근태 요청 목록 (페이지)
    @GetMapping("/admin/attendance/list")
    public String pendingAttendanceList(Model model) {

        // 대기 요청만 db에서 가져옴
        List<RequestDTO> requests =
                attendanceAdminQueryService.getPendingRequests();

        // 모델에 담고 화면 반환
        model.addAttribute("requests", requests);
        return "Members/admin_attendance_list";
    }

    // ResponseBody 화면처리 비동기 방식 -승인처리-
    @PostMapping("/admin/attendance/approve")
    @ResponseBody
    public String approve(
            @RequestParam Long requestId,
            HttpSession session) {

        // 관리자 세션을 담아서 어떤 형식으로도 관리자만 처리
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";

        // requestIdd(요청의 id) ,adminId(승인자)
        attendanceApproveService.approve(requestId, admin.getAdminId());
        return "success";
    }

    @PostMapping("/admin/attendance/reject")
    @ResponseBody
    public String reject(
            @RequestParam Long requestId,
            @RequestParam String reason,
            HttpSession session) {

        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";

        // 반려는 reason 반려사유 필수
        attendanceApproveService.reject(
                requestId,
                admin.getAdminId(),
                reason
        );
        return "success";
    }


}
