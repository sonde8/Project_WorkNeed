package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.AdminUserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    //세션100구조
    @GetMapping("/member/list")
    public String adminUserList(
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String userLoginId,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Long rankId,
            @RequestParam(required = false) String userStatus,
            HttpSession session,
            Model model) {

        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "redirect:/login";

        if (session.getAttribute("permissions") == null) {
            List<String> permissions = adminUserService.getPermissionsByRoleId(admin.getRoleId());
            session.setAttribute("permissions", permissions);
            System.out.println("로그인 관리자 [" + admin.getAdminName() + "] 권한 로드: " + permissions);
        }

        List<UserDTO> memberList = adminUserService.getAllMembers(userName, userLoginId, deptId, rankId, userStatus);

        model.addAttribute("admin", admin);
        model.addAttribute("user", memberList);
        model.addAttribute("dept", adminUserService.getAllDepts());
        model.addAttribute("rank", adminUserService.getAllRanks());

        model.addAttribute("userName", userName);
        model.addAttribute("userLoginId", userLoginId);
        model.addAttribute("selectedDeptId", deptId);
        model.addAttribute("selectedRankId", rankId);
        model.addAttribute("selectedStatus", userStatus);

        return "Members/admin_user_list";
    }

    // 1. 정보 수정
    @PostMapping("/member/edit/save")
    @ResponseBody
    public String adminUserEditSave(@RequestBody UserDTO userDto, HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";

        try {
            // 서비스에서 개별 로그를 남기도록 adminId 전달
            adminUserService.updateMemberStatusWithLog(
                    userDto.getUserId(),
                    userDto.getUserStatus(),
                    userDto.getDeptId(),
                    userDto.getRankId(),
                    admin
            );
            return "success";
        } catch (Exception e) {
            e.printStackTrace();
            return "fail";
        }
    }

    // 2. 상태 변경
    @PostMapping("/member/batch-update")
    @ResponseBody
    public String batchUpdateStatus(@RequestParam("userIds") List<Long> userIds,
                                    @RequestParam("status") String status,
                                    HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";

        try {
            adminUserService.batchUpdateUserStatus(userIds, status, admin);
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }


    // 관리자 생성 매핑
    @PostMapping("/member/add-admin")
    @ResponseBody
    public String addAdminAccount(@RequestBody AdminUserDTO adminDto, HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "로그인이 필요합니다.";

        try {
            adminUserService.createAdmin(adminDto, admin);
            return "success";
        } catch (IllegalStateException e) {
            return e.getMessage();   // 이메일 중복 등
        } catch (SecurityException e) {
            return "권한이 없습니다.";
        } catch (IllegalArgumentException e) {
            return e.getMessage();
        } catch (Exception e) {
            return "서버 오류";
        }
    }

    // 관리자 상태변경
    @PostMapping("/member/admin-status")
    @ResponseBody
    public String updateAdminStatus(@RequestParam("targetId") Long targetId,
                                    @RequestParam("status") String status,
                                    HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";

        try {
            adminUserService.changeAdminStatus(targetId, status, admin);
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }


    // 3. 부서 추가 (adminId 전달)
    @PostMapping("/dept/add")
    @ResponseBody
    public String addDept(@RequestParam("deptName") String deptName, HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";
        try {
            adminUserService.createDept(deptName, admin);
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }

    // 4. 직급 추가 (adminId 전달)
    @PostMapping("/rank/add")
    @ResponseBody
    public String addRank(@RequestParam("rankName") String rankName, HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";
        try {
            adminUserService.createRank(rankName, admin);
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }

    // 5. 부서 삭제 (adminId 전달)
    @PostMapping("/dept/delete")
    @ResponseBody
    public String deleteDept(@RequestParam("deptId") Long deptId, HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";
        adminUserService.deleteDept(deptId, admin);
        return "success";
    }

    // 6. 직급 삭제 (adminId 전달)
    @PostMapping("/rank/delete")
    @ResponseBody
    public String deleteRank(@RequestParam("rankId") Long rankId, HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";
        adminUserService.deleteRank(rankId, admin);
        return "success";
    }


    // 6. 관리자 목록 조회
    @GetMapping("/manage/list")
    public String adminManageList(HttpSession session, Model model) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "redirect:/login";

        model.addAttribute("admin", admin); // 헤더용
        model.addAttribute("admins", adminUserService.getAllAdmins()); // 관리자 리스트
        return "Members/admin_manage_list"; // 새로 만들 HTML 파일명
    }


    // 6. 활동 로그 조회
    @GetMapping("/log/list")
    public String adminLogList(HttpSession session, Model model) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "redirect:/login";

        model.addAttribute("admin", admin); // 헤더용
        model.addAttribute("logs", adminUserService.getAllLogs()); // 로그 리스트
        return "Members/admin_activity_log"; // 새로 만들 HTML 파일명
    }


    // 7. 관리자 상태 변경
    @PostMapping("/manage/status")
    @ResponseBody
    public String changeAdminStatus(@RequestParam("targetId") Long targetId,
                                    @RequestParam("status") String status,
                                    HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";

        try {
            // targetId가 본인인 경우 정지 못하게 하는 방어 로직 (선택사항)
            if (targetId.equals(admin.getAdminId()) && "SUSPENDED".equals(status)) {
                return "self_error";
            }
            adminUserService.changeAdminStatus(targetId, status, admin);
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }
}