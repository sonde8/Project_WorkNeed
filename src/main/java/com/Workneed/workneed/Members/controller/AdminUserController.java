package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.DeptDTO;
import com.Workneed.workneed.Members.dto.RankDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import com.Workneed.workneed.Members.mapper.DeptMapper;
import com.Workneed.workneed.Members.mapper.RankMapper;
import com.Workneed.workneed.Members.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserMapper adminUserMapper;
    private final UserMapper userMapper;
    private final DeptMapper deptMapper;
    private final RankMapper rankMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    @GetMapping("/member/list")
    public String adminUserList(Model model) {
        // 세부 정보가 들어있는 메서드 호출
        model.addAttribute("user", userMapper.findAllWithDetails());
        model.addAttribute("dept", deptMapper.findAll());
        model.addAttribute("rank", rankMapper.findAll());
        return "members/admin_user_list";
    }

    @PostMapping("/member/edit/save")
    @ResponseBody
    public String adminUserEditSave(@RequestBody UserDTO userDto) {
        try {
            // 실제 수정을 수행하는 매퍼 메서드 확인 필요 (updateUser 또는 전용 메서드)
            adminUserMapper.updateMemberStatus(userDto);
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
            if (adminDto.getAdminPassword() != null && !adminDto.getAdminPassword().isEmpty()) {
                adminDto.setAdminPassword(passwordEncoder.encode(adminDto.getAdminPassword()));
            }
            adminUserMapper.insertAdmin(adminDto);
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
            userMapper.updateUsersStatus(userIds, status);
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
            DeptDTO dto = new DeptDTO();
            dto.setDeptName(deptName);
            deptMapper.insertDept(dto);
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
            RankDTO dto = new RankDTO();
            dto.setRankName(rankName);
            rankMapper.insertRank(dto);
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }



}