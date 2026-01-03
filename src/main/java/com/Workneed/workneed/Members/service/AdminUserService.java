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
    private final MailService mailService;

    // 1. 화면 데이터 가져오기
    public List<UserDTO> getAllMembers(String userName, String userLoginId, Long deptId, Long rankId, String userStatus) {
        // 컨트롤러에서 받은 userStatus를 매퍼의 파라미터로 그대로 던져줍니다.
        return adminUserMapper.findAllMembersForAdmin(userName, userLoginId, deptId, rankId, userStatus);
    }

    public List<DeptDTO> getAllDepts() {
        return deptMapper.findAll();
    }

    public List<RankDTO> getAllRanks() {
        return rankMapper.findAll();
    }

    // 사용자관리
    public void updateMember(UserDTO userDto) {
        adminUserMapper.updateMemberStatus(userDto);
    }

    public void batchUpdateUserStatus(List<Long> userIds, String status) {
        // 1. DB 상태 변경
        userMapper.updateUsersStatus(userIds, status);

        // 2. 승인(ACTIVE) 처리인 경우에만 이메일 발송
        if ("ACTIVE".equals(status)) {
            for (Long id : userIds) {
                UserDTO user = userMapper.findById(id); // 유저 정보 조회
                if (user != null && user.getUserEmail() != null) {
                    // 메일 서비스 호출
                    mailService.sendApprovalEmail(user.getUserEmail(), user.getUserName());
                }
            }
        }
    }

    // 관리자 계정
    public void createAdmin(AdminUserDTO adminDto) {
        adminDto.setAdminPassword(
                passwordEncoder.encode(adminDto.getAdminPassword())
        );
        adminDto.setAdminStatus("ACTIVE");
        adminUserMapper.insertAdmin(adminDto);
    }

    // 직급 ,부서관리
    public void createDept(String deptName) {
        DeptDTO dto = new DeptDTO();
        dto.setDeptName(deptName);
        deptMapper.insertDept(dto);
    }

    public void createRank(String rankName) {
        RankDTO dto = new RankDTO();
        dto.setRankName(rankName);
        rankMapper.insertRank(dto);
    }

    @Transactional
    public String deleteDept(Long deptId) {
        // 1. 미배정(6) 삭제 방지
        if (deptId == 6) return "is_default";

        try {
            // 2. 소속 인원을 먼저 6번으로 이동 (user 테이블 사용)
            userMapper.updateUserDeptToDefault(deptId);

            // 3. 부서 삭제 (DeptMapper 사용)
            deptMapper.deleteDept(deptId);
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }

    @Transactional
    public String deleteRank(Long rankId) {
        // 1. 신입(6) 삭제 방지
        if (rankId == 6) return "is_default";

        try {
            // 2. 해당 직급 인원을 먼저 6번으로 이동 (user 테이블 사용)
            userMapper.updateUserRankToDefault(rankId);

            // 3. 직급 삭제 (RankMapper 사용)
            rankMapper.deleteRank(rankId);
            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }



}