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

// 관리자 페이지에서 다루는 권한기능 모음
@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    // 권한이 없으면 자동로드, 권한을 key값에 저장
    @GetMapping("/member/list")
    public String adminUserList(
            // 하나의 페이지에서 전체 보기 , 검색 결과 보기를 모두 처리하는 필터
            // false로 처리하여 검색 시 조건에 없어도 오류 x
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String userLoginId,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Long rankId,
            @RequestParam(required = false) String userStatus,
            HttpSession session,
            Model model) {

        // 관리자 아니면 로그인화면
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "redirect:/login";

        if (session.getAttribute("permissions") == null) {
            List<String> permissions = adminUserService.getPermissionsByRoleId(admin.getRoleId());
            session.setAttribute("permissions", permissions);
        }

        // 한 유저의 모든정보 가져와서 리스트에담음
        List<UserDTO> memberList = adminUserService.getAllMembers(userName, userLoginId, deptId, rankId, userStatus);

        // html넘겨주기위해 key value로 이름간소화, 이름 구체화
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

    // 1. 정보 변경(직급,부서) 및 변경자로그남김
    @PostMapping("/member/edit/save")
    @ResponseBody
    public String adminUserEditSave(@RequestBody UserDTO userDto, HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";

        // 에러가 나더라도 프로그램이 터지지 않고, 관리자에게  신호를 보내서 작업 실패 안내
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
        if (admin == null) return "fail";

        try {
            adminUserService.createAdmin(adminDto, admin);
            return "success";
        } catch (IllegalStateException e) {
            return e.getMessage();   // 이메일 중복
        } catch (SecurityException e) {
            return "권한이 없습니다.";
        } catch (IllegalArgumentException e) {
            return e.getMessage();  // 비어있는 값 처리
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


    // 3. 부서 추가
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

    // 4. 직급 추가
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

    // 5. 부서 삭제
    @PostMapping("/dept/delete")
    @ResponseBody
    public String deleteDept(@RequestParam("deptId") Long deptId, HttpSession session) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "fail";
        adminUserService.deleteDept(deptId, admin);
        return "success";
    }

    // 6. 직급 삭제 
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

        model.addAttribute("admin", admin);
        model.addAttribute("admins", adminUserService.getAllAdmins()); // 관리자 리스트
        return "Members/admin_manage_list";
    }


    // 6. 활동 로그 조회
    @GetMapping("/log/list")
    public String adminLogList(HttpSession session, Model model) {
        AdminUserDTO admin = (AdminUserDTO) session.getAttribute("admin");
        if (admin == null) return "redirect:/login";

        model.addAttribute("admin", admin);
        model.addAttribute("logs", adminUserService.getAllLogs()); // 로그 리스트
        return "Members/admin_activity_log";
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
            // targetId가 본인인 경우 정지 못하게 하는 방어 로직
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