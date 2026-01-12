package com.Workneed.workneed.Approval.controller;

import com.Workneed.workneed.Approval.LeaveType;
import com.Workneed.workneed.Approval.dto.LeaveRequestDTO;
import com.Workneed.workneed.Approval.service.ApprovalLeaveService;
import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/approval/leave")
public class LeaveController {

    private final ApprovalLeaveService approvalLeaveService;

    public LeaveController(ApprovalLeaveService approvalLeaveService) {
        this.approvalLeaveService = approvalLeaveService;
    }

    // ✅ ApprovalController와 동일한 세션 기준: session.getAttribute("user") == UserDTO
    private Long getLoginUserId(HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        return (user == null) ? null : user.getUserId();
    }

    private String redirectLogin() {
        return "redirect:/login";
    }

    // ✅ GET /approval/leave (휴가 작성 폼)
    @GetMapping("")
    public String form(Model model, HttpSession session, LeaveType leaveType) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        model.addAttribute("types", LeaveType.values());
        model.addAttribute("dto", new LeaveRequestDTO());
        return "Approval/approval.leave";
    }

    // ✅ POST /approval/leave/submit (휴가 제출)
    @PostMapping("/submit")
    public String submitLeave(@ModelAttribute("dto") LeaveRequestDTO dto,
                              HttpSession session) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        Long docId = approvalLeaveService.submitLeave(dto, userId);

        // 디테일은 기존 라우트에 맞추십시오.
        return "redirect:/approval/detail/" + docId;
    }


}
