package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.DeptDTO;
import com.Workneed.workneed.Members.dto.RankDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import com.Workneed.workneed.Members.mapper.DeptMapper;
import com.Workneed.workneed.Members.mapper.RankMapper;
import com.Workneed.workneed.Members.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AdminUserMapper adminUserMapper;
   private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final DeptMapper deptMapper;
    private final RankMapper rankMapper;
  //private final MailService mailService;

    // 1. 화면 데이터 가져오기 (기존 동일)
    public List<UserDTO> getAllMembers(String userName, String userLoginId, Long deptId, Long rankId, String userStatus) {
        return adminUserMapper.findAllMembersForAdmin(userName, userLoginId, deptId, rankId, userStatus);
    }

    public List<DeptDTO> getAllDepts() {
        return deptMapper.findAll();
    }

    public List<RankDTO> getAllRanks() {
        return rankMapper.findAll();
    }

    public List<String> getPermissionsByRoleId(Long roleId) {
        return adminUserMapper.findPermissionsByRoleId(roleId);
    }

    // [수정] 사용자 정보 수정 (adminId 추가)
    public void updateMember(UserDTO userDto, Long adminId) {
        adminUserMapper.updateMemberStatus(userDto);
        // 로그 기록
        saveLog(adminId, "UPDATE", "USER", userDto.getUserId(), "직원 정보 및 상태 수정");
    }


    // [수정] 관리자 계정 생성 (adminId 추가)
    public void createAdmin(AdminUserDTO adminDto, Long adminId) {
        adminDto.setAdminPassword(passwordEncoder.encode(adminDto.getAdminPassword()));
        adminDto.setAdminStatus("ACTIVE");
        adminUserMapper.insertAdmin(adminDto);
        // 로그 기록
        saveLog(adminId, "CREATE", "ADMIN", adminDto.getAdminId(), "새 관리자 계정 생성: " + adminDto.getAdminEmail());
    }



    // 하나로 통합하고 명칭을 changeAdminStatus로 통일
    @Transactional
    public void changeAdminStatus(Long targetAdminId, String status, Long currentAdminId) {
        adminUserMapper.updateAdminStatus(targetAdminId, status);

        String action = status.equals("SUSPENDED") ? "SUSPEND_ADMIN" : "ACTIVATE_ADMIN";
        String desc = String.format("관리자(ID:%d) 상태를 [%s]로 변경", targetAdminId, status);

        saveLog(currentAdminId, action, "ADMIN", targetAdminId, desc);
    }

    // 로그인 시각 업데이트 기능 추가
    @Transactional
    public void updateLoginTime(Long adminId) {
        adminUserMapper.updateLastLogin(adminId);
    }



    public List<AdminUserDTO> getAllAdmins() {
        return adminUserMapper.findAllAdmins();
    }

    public List<AdminUserDTO> getAllLogs() {
        return adminUserMapper.findAllActivityLogs();
    }

    // [수정] 부서 추가 (adminId 추가)
    public void createDept(String deptName, Long adminId) {
        DeptDTO dto = new DeptDTO();
        dto.setDeptName(deptName);
        deptMapper.insertDept(dto);
        // 로그 기록 (id를 가져오기 위해 insert 후 호출)
        saveLog(adminId, "CREATE", "DEPT", dto.getDeptId(), "부서 신설: " + deptName);
    }

    // [수정] 직급 추가 (adminId 추가)
    public void createRank(String rankName, Long adminId) {
        RankDTO dto = new RankDTO();
        dto.setRankName(rankName);
        rankMapper.insertRank(dto);
        // 로그 기록
        saveLog(adminId, "CREATE", "RANK", dto.getRankId(), "직급 신설: " + rankName);
    }

    // [수정] 부서 삭제 (adminId 추가)
    @Transactional
    public String deleteDept(Long deptId, Long adminId) {
        if (deptId == 6) return "is_default";
        try {
            userMapper.updateUserDeptToDefault(deptId);
            deptMapper.deleteDept(deptId);
            // 로그 기록
            saveLog(adminId, "DELETE", "DEPT", deptId, "부서 삭제");
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }

    @Transactional
    public String deleteRank(Long rankId, Long adminId) {
        if (rankId == 6) return "is_default";
        try {
            userMapper.updateUserRankToDefault(rankId);
            rankMapper.deleteRank(rankId);
            saveLog(adminId, "DELETE", "RANK", rankId, "직급 삭제");
            return "success";
        } catch (Exception e) {
            // 이 부분을 추가해서 에러가 왜 나는지 콘솔에서 확인하세요!
            e.printStackTrace();
            return "fail";
        }
    }

    // [기존 유지] 개별 상태 변경 로그용
    @Transactional
    public void updateMemberStatusWithLog(Long userId, String status, Long deptId, Long rankId, Long adminId) {
        UserDTO userDto = new UserDTO();
        userDto.setUserId(userId);
        userDto.setUserStatus(status);
        userDto.setDeptId(deptId);
        userDto.setRankId(rankId);

        adminUserMapper.updateMemberStatus(userDto);

        String desc = String.format("직원(ID:%d) 상태를 [%s]로 변경", userId, status);
        saveLog(adminId, "UPDATE_STATUS", "USER", userId, desc);

        if ("ACTIVE".equals(status)) {
            UserDTO targetUser = userMapper.findById(userId);
            if (targetUser != null && targetUser.getUserEmail() != null) {
                //mailService.sendApprovalEmail(targetUser.getUserEmail(), targetUser.getUserName());
            }
        }


    }

    // [통합] 일괄 변경 (기존의 adminId 없는 메서드는 삭제하세요)
    @Transactional
    public void batchUpdateUserStatus(List<Long> userIds, String status, Long adminId) {
        for (Long id : userIds) {
            UserDTO current = userMapper.findById(id);
            if (current != null) {
                updateMemberStatusWithLog(id, status, current.getDeptId(), current.getRankId(), adminId);
            }
        }
    }

    // 로그 저장용 (기존 유지)
    private void saveLog(Long adminId, String action, String targetType, Long targetId, String desc) {
        AdminUserDTO logDto = new AdminUserDTO();
        logDto.setAdminId(adminId);
        logDto.setLogActionType(action);
        logDto.setLogTargetType(targetType);
        logDto.setLogTargetId(targetId);
        logDto.setLogDescription(desc);

        adminUserMapper.insertActivityLog(logDto);
    }
}