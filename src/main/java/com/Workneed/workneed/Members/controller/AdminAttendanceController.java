package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.RequestDTO;
import com.Workneed.workneed.Members.service.AttendanceAdminService;
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

@Controller
@RequiredArgsConstructor
public class AdminAttendanceController {

    private final AttendanceAdminService attendanceAdminService;
    private final AttendanceApproveService attendanceApproveService;

    // 🔹 근태 요청 목록 (페이지)
    @GetMapping("/admin/attendance/list")
    public String pendingAttendanceList(Model model) {

        List<RequestDTO> requests =
                attendanceAdminService.getPendingRequests();

        model.addAttribute("requests", requests);
        return "members/admin_attendance_list";
    }

    // 🔹 승인
    @PostMapping("/admin/attendance/approve")
    @ResponseBody
    public String approve(
            @RequestParam Long requestId,
            HttpSession session) {

        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";

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

        attendanceApproveService.reject(
                requestId,
                admin.getAdminId(),
                reason
        );
        return "success";
    }


}
