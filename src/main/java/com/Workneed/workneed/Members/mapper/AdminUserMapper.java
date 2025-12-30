package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminUserMapper {

    AdminUserDTO findByAdminEmail(@Param("adminEmail") String adminEmail);


    // 1. 관리자용 전체 직원 목록 조회 (명세서 4번)
    List<UserDTO> findAllMembersForAdmin();

    // 2. 일반 직원 정보 수정 (부서, 직급 등 변경 시 사용)
    void updateMemberStatus(UserDTO userDto);

    // 3. 별도의 신규 관리자 계정 생성 (계정 발급용)
    void insertAdmin(AdminUserDTO adminDto);

    // 4. 휴가/결재 요청 처리 (명세서 4번 하단 기능 예상)
    void processRequest(@Param("requestId") Long requestId,
                        @Param("status") String status,
                        @Param("adminId") Long adminId);

    List<UserDTO> findAllWithDetails();

    void clearRememberToken(@Param("userId") Long userId);

}