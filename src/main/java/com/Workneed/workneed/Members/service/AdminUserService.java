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
    private final UserMapper userMapper;
    private final DeptMapper deptMapper;
    private final RankMapper rankMapper;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    /* =========================
        역할 판별
    ========================= */
    private boolean isSuper(AdminUserDTO a) {
        return a != null && a.getRoleId() == 1L;
    }

    private boolean isManager(AdminUserDTO a) {
        return a != null && a.getRoleId() == 2L;
    }

    private boolean isStaff(AdminUserDTO a) {
        return a != null && a.getRoleId() == 3L;
    }


    // 관리자 생성
    @Transactional
    public void createAdmin(AdminUserDTO newAdmin, AdminUserDTO actor) {

        if (!isSuper(actor)) {
            throw new SecurityException("관리자 생성 권한 없음");
        }


        // 1. 필수값 체크
        if (newAdmin.getAdminEmail() == null || newAdmin.getAdminPassword() == null) {
            throw new IllegalArgumentException("필수 정보 누락");
        }

        // 2. 이메일 중복 체크
        if (adminUserMapper.existsByEmail(newAdmin.getAdminEmail())) {
            throw new IllegalStateException("이미 사용 중인 이메일");
        }

        // 3. 비밀번호 암호화
        newAdmin.setAdminPassword(
                passwordEncoder.encode(newAdmin.getAdminPassword())
        );

        newAdmin.setAdminStatus("ACTIVE");

        // 4. 저장
        adminUserMapper.insertAdmin(newAdmin);

        // 5. 로그
        saveLog(
                actor.getAdminId(),
                "CREATE",
                "ADMIN",
                newAdmin.getAdminId(),
                "관리자 계정 생성"
        );
    }

    public List<String> getPermissionsByRoleId(Long roleId) {
        return adminUserMapper.findPermissionsByRoleId(roleId);
    }

    //  관리자 로그인 시각 업데이트
    @Transactional
    public void updateLoginTime(Long adminId) {
        if (adminId == null) {
            throw new IllegalArgumentException("adminId is null");
        }
        adminUserMapper.updateLastLogin(adminId);
    }

    // 관리자 상태변경
    @Transactional
    public void changeAdminStatus(
            Long targetAdminId,
            String status,
            AdminUserDTO actor
    ) {
        // 수행자 권한 체크
        if (!(isSuper(actor) || isManager(actor))) {
            throw new SecurityException("관리자 상태 변경 권한 없음");
        }

        if (targetAdminId == null) {
            throw new IllegalArgumentException("대상 관리자 ID 없음");
        }

        // 대상 관리자 조회
        AdminUserDTO target = adminUserMapper.findByAdminId(targetAdminId);
        if (target == null) {
            throw new IllegalArgumentException("대상 관리자가 존재하지 않음");
        }

        // 자기 자신 정지 방어
        if (actor.getAdminId().equals(targetAdminId)
                && "SUSPENDED".equals(status)) {
            throw new IllegalStateException("본인 계정은 정지할 수 없음");
        }

        // 상위 관리자 보호 로직
        // roleId 숫자 작을수록 상위
        if (actor.getRoleId() > target.getRoleId()) {
            throw new SecurityException("상위 관리자 상태는 변경할 수 없음");
        }

        // 상태 변경
        adminUserMapper.updateAdminStatus(targetAdminId, status);

        // 로그 기록
        String desc = String.format(
                "관리자(ID:%d) 상태를 [%s]로 변경",
                targetAdminId, status
        );

        saveLog(
                actor.getAdminId(),
                "UPDATE_ADMIN_STATUS",
                "ADMIN",
                targetAdminId,
                desc
        );
        System.out.println("상태 변경 시작 - 대상: " + targetAdminId + ", 수행자 RoleId: " + actor.getRoleId());
    }


    // 부서추가
    public void createDept(String deptName, AdminUserDTO actor) {
        // 기존: if (!isSuper(actor))
        // 수정: SUPER 혹은 MANAGER인 경우 허용
        if (!(isSuper(actor) || isManager(actor))) {
            throw new SecurityException("부서 생성 권한 없음");
        }

        DeptDTO dto = new DeptDTO();
        dto.setDeptName(deptName);
        deptMapper.insertDept(dto);

        saveLog(actor.getAdminId(), "CREATE", "DEPT",
                dto.getDeptId(), "부서 생성");
    }

    //직급 추가
    public void createRank(String rankName, AdminUserDTO actor) {
        // 기존: if (!isSuper(actor))
        // 수정: SUPER 혹은 MANAGER인 경우 허용
        if (!(isSuper(actor) || isManager(actor))) {
            throw new SecurityException("직급 생성 권한 없음");
        }

        RankDTO dto = new RankDTO();
        dto.setRankName(rankName);
        rankMapper.insertRank(dto);

        saveLog(actor.getAdminId(), "CREATE", "RANK",
                dto.getRankId(), "직급 생성");
    }



    // 부서 삭제
    @Transactional
    public void deleteDept(Long deptId, AdminUserDTO actor) {
        if (!isSuper(actor)) {
            throw new SecurityException("부서 삭제 권한 없음");
        }
        if (deptId == 6L) {
            throw new IllegalStateException("기본 부서 삭제 불가");
        }

        userMapper.updateUserDeptToDefault(deptId);
        deptMapper.deleteDept(deptId);

        saveLog(actor.getAdminId(), "DELETE", "DEPT", deptId, "부서 삭제");
    }


    // 직급 삭제
    @Transactional
    public void deleteRank(Long rankId, AdminUserDTO actor) {
        if (!isSuper(actor)) {
            throw new SecurityException("직급 삭제 권한 없음");
        }
        if (rankId == 6L) {
            throw new IllegalStateException("기본 직급 삭제 불가");
        }

        userMapper.updateUserRankToDefault(rankId);
        rankMapper.deleteRank(rankId);

        saveLog(actor.getAdminId(), "DELETE", "RANK", rankId, "직급 삭제");
    }


    // 직원 상태/조직 변경
    @Transactional
    public void updateMemberStatusWithLog(
            Long userId,
            String status,
            Long deptId,
            Long rankId,
            AdminUserDTO actor
    ) {
        if (actor == null || !"ACTIVE".equals(actor.getAdminStatus())) {
            throw new SecurityException("비활성 관리자 접근 권한이 없습니다.");
        }

        // 1. 변경 전 데이터 조회 (JOIN 쿼리로 deptname, rankname 포함)
        UserDTO current = userMapper.findById(userId);
        if (current == null) {
            throw new IllegalArgumentException("대상 직원을 찾을 수 없습니다.");
        }

        // 2. 로그 메시지 조립 시작
        StringBuilder logDesc = new StringBuilder(String.format("[%s]님 정보 변경: ", current.getUserName()));
        boolean isChanged = false;

        // 상태 변경 확인
        if (!current.getUserStatus().equals(status)) {
            logDesc.append(String.format("상태(%s→%s) ", current.getUserStatus(), status));
            isChanged = true;
        }

        // 부서 변경 확인 (실제 ID가 다를 때만 이름 조회)
        if (!current.getDeptId().equals(deptId)) {
            String newDeptName = deptMapper.findById(deptId).getDeptName();
            logDesc.append(String.format("부서(%s→%s) ", current.getDeptName(), newDeptName));
            isChanged = true;
        }

        // 직급 변경 확인 (실제 ID가 다를 때만 이름 조회)
        if (!current.getRankId().equals(rankId)) {
            String newRankName = rankMapper.findById(rankId).getRankName();
            logDesc.append(String.format("직급(%s→%s) ", current.getRankName(), newRankName));
            isChanged = true;
        }

        // 3. 변경 사항이 있을 때만 업데이트 및 로그 저장
        if (isChanged) {
            UserDTO update = new UserDTO();
            update.setUserId(userId);
            update.setUserStatus(status);
            update.setDeptId(deptId);
            update.setRankId(rankId);

            // 실제 DB 업데이트
            adminUserMapper.updateMemberStatus(update);

            // 로그 저장
            saveLog(actor.getAdminId(), "UPDATE_STATUS", "USER", userId, logDesc.toString());

        }
        //  활성화 시 메일 발송
        if ("ACTIVE".equals(status) && !"ACTIVE".equals(current.getUserStatus())) {
            if (current.getUserEmail() != null) {
                mailService.sendWelcomeEmail(current.getUserEmail(), current.getUserName());
            }
        }
    }



    // 일괄 상태 변경
    @Transactional
    public void batchUpdateUserStatus(
            List<Long> userIds,
            String status,
            AdminUserDTO actor
    ) {
        for (Long userId : userIds) {
            UserDTO u = userMapper.findById(userId);
            if (u == null) continue;

            updateMemberStatusWithLog(
                    userId,
                    status,
                    u.getDeptId(),
                    u.getRankId(),
                    actor
            );
        }
    }



    // 조회
    public List<UserDTO> getAllMembers(String userName, String userLoginId,
                                       Long deptId, Long rankId, String userStatus) {
        return adminUserMapper.findAllMembersForAdmin(
                userName, userLoginId, deptId, rankId, userStatus);
    }

    public List<DeptDTO> getAllDepts() {
        return deptMapper.findAll();
    }

    public List<RankDTO> getAllRanks() {
        return rankMapper.findAll();
    }

    public List<AdminUserDTO> getAllAdmins() {
        return adminUserMapper.findAllAdmins();
    }

    public List<AdminUserDTO> getAllLogs() {
        return adminUserMapper.findAllActivityLogs();
    }


    // 로그 저장
    private void saveLog(Long adminId, String action,
                         String targetType, Long targetId, String desc) {
        AdminUserDTO log = new AdminUserDTO();
        log.setAdminId(adminId);
        log.setLogActionType(action);
        log.setLogTargetType(targetType);
        log.setLogTargetId(targetId);
        log.setLogDescription(desc);

        adminUserMapper.insertActivityLog(log);
    }
}
