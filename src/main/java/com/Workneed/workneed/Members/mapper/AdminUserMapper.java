package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminUserMapper {

    AdminUserDTO findByAdminEmail(@Param("adminEmail") String adminEmail);


    // 1. 관리자용 직원 목록 조회
    List<UserDTO> findAllMembersForAdmin(
            @Param("userName") String userName,
            @Param("userLoginId") String userLoginId,
            @Param("deptId") Long deptId,
            @Param("rankId") Long rankId,
            @Param("userStatus") String userStatus
    );

    // 2. 일반 직원 정보 수정 (부서, 직급 등 변경 시 사용)
    void updateMemberStatus(UserDTO userDto);

    // 3. 별도의 신규 관리자 계정 생성 (계정 발급용)
    void insertAdmin(AdminUserDTO adminDto);

    // 4. 휴가/결재 요청 처리 (미처리)
    void processRequest(@Param("requestId") Long requestId,
                        @Param("status") String status,
                        @Param("adminId") Long adminId);

    // 5 관리자로그
    void insertActivityLog(AdminUserDTO logDto);


    // 6 관리자 전체 목록 조회
    List<AdminUserDTO> findAllAdmins();

    // 7 활동 로그 전체 조회
    List<AdminUserDTO> findAllActivityLogs();

    // 8 관리자 상태 변경
    void updateAdminStatus(@Param("adminId") Long adminId, @Param("status") String status);

    // 9 마지막 로그인 시간
    void updateLastLogin(@Param("adminId") Long adminId);

    // 10 역할 ID로 권한 코드(String) 목록 가져오기
    List<String> findPermissionsByRoleId(@Param("roleId") Long roleId);






}