package com.Workneed.workneed.Approval.controller;

import com.Workneed.workneed.Approval.dto.LeaveRequestDTO;
import com.Workneed.workneed.Approval.service.ApprovalLeaveService;
import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/approval")
public class LeaveController {

    private final ApprovalLeaveService approvalLeaveService;

    public LeaveController(ApprovalLeaveService approvalLeaveService) {
        this.approvalLeaveService = approvalLeaveService;
    }

     /* ==========================================================
       공통 세션 유틸 (유저 파트 기준)
       ========================================================== */

    private UserDTO getLoginUser(HttpSession session) {
        return (UserDTO) session.getAttribute("user"); // ✅ UserDTO
    }

    private Long getLoginUserId(HttpSession session) {
        UserDTO user = getLoginUser(session);
        return (user == null) ? null : user.getUserId();
    }

    private String redirectLogin() {
        // ✅ 성욱님 프로젝트는 /login 쓰고 있으니 통일
        return "redirect:/login";
    }


    // ✅ 휴가 신청 폼 화면
    @GetMapping("/leave")
    public String leaveForm(Model model, HttpSession session) {
        Long userId = getLoginUserId(session);
        if (userId == null) return "redirect:/login"; // ✅ 실제 로그인 매핑으로

        model.addAttribute("dto", new LeaveRequestDTO());
        return "Approval/approval.leave";
    }

    // ✅ 휴가 신청 제출
    @PostMapping("/leave/request")
    public String request(@ModelAttribute("dto") LeaveRequestDTO dto,
                          HttpSession session){

        Long userId = getLoginUserId(session);
        if (userId == null) return "redirect:/login";

        Long docId = approvalLeaveService.submitLeave(dto, userId);
        return "redirect:/approval/leave/" + docId;
    }

    private void debugSession(HttpSession session, String where) {
        System.out.println("==== " + where + " ====");
        System.out.println("sessionId = " + session.getId());
        System.out.println("user attr = " + session.getAttribute("user"));
        System.out.println("userId attr = " + session.getAttribute("userId"));
    }

    // ✅ 휴가 신청 결과(상세) 화면
    @GetMapping("/leave/{docId}")
    public String leaveDetail(
            @PathVariable Long docId,
            Model model,
            HttpSession session) {
        Long userId = getLoginUserId(session);
        if (userId == null) return redirectLogin();

        LeaveRequestDTO leave = leaveService.getLeaveDetail(docId, userId);
        if (leave == null) return "redirect:/approval/leave";

        model.addAttribute("leave", leave);
        return "Approval/approval.leave.detail";
        // ⬆️ 템플릿 실제 경로에 맞게 조정
    }
}
