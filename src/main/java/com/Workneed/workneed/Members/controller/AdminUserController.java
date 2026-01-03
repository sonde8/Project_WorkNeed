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



        // 파라미터를 서비스에 그대로 전달합니다.
        List<UserDTO> memberList = adminUserService.getAllMembers(userName, userLoginId, deptId, rankId, userStatus);

        model.addAttribute("admin", admin);
        model.addAttribute("user", memberList);
        model.addAttribute("dept", adminUserService.getAllDepts());
        model.addAttribute("rank", adminUserService.getAllRanks());

        // 검색창에 입력했던 값이 유지되도록 모델에 다시 담아줍니다 (선택사항이지만 UX에 좋음)
        model.addAttribute("selectedDeptId", deptId);
        model.addAttribute("selectedRankId", rankId);
        model.addAttribute("selectedStatus", userStatus);

        return "members/admin_user_list";
    }

    @PostMapping("/member/edit/save")
    @ResponseBody
    public String adminUserEditSave(@RequestBody UserDTO userDto) {
        try {

            adminUserService.updateMember(userDto);


            return "success";
        } catch (Exception e) {
            e.printStackTrace();
            return "fail";
        }
    }

    @PostMapping("/member/add-admin")
    @ResponseBody
    public String addAdminAccount(@RequestBody AdminUserDTO adminDto) {
        try {
            adminUserService.createAdmin(adminDto);
            return "success";
        } catch (Exception e) {
            e.printStackTrace();
            return "fail";
        }
    }

    // 일괄 상태 변경 (AJAX 방식)
    @PostMapping("/member/batch-update")
    @ResponseBody
    public String batchUpdateStatus(@RequestParam("userIds") List<Long> userIds,
                                    @RequestParam("status") String status) {
        try {
            // UserMapper에 작성한 일괄 업데이트 메서드 호출
            adminUserService.batchUpdateUserStatus(userIds, status);
            return "success";
        } catch (Exception e) {
            e.printStackTrace();
            return "fail";
        }
    }

    // 부서 자체를 생성하여 추가
    @PostMapping("/dept/add")
    @ResponseBody
    public String addDept(@RequestParam("deptName") String deptName) {
        try {
            adminUserService.createDept(deptName);
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }

    // 직급 자체를 생성하여 추가
    @PostMapping("/rank/add")
    @ResponseBody
    public String addRank(@RequestParam("rankName") String rankName) {
        try {
            adminUserService.createRank(rankName);
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }

    @PostMapping("/dept/delete")
    @ResponseBody
    public String deleteDept(@RequestParam("deptId") Long deptId) {
        // 컨트롤러가 직접 DB를 건드리는 대신, 서비스의 메서드를 호출합니다.
        return adminUserService.deleteDept(deptId);
    }

    @PostMapping("/rank/delete")
    @ResponseBody
    public String deleteRank(@RequestParam("rankId") Long rankId) {
        // 마찬가지로 서비스 호출
        return adminUserService.deleteRank(rankId);
    }
}