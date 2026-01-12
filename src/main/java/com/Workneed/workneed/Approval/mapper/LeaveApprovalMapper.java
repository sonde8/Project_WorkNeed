package com.Workneed.workneed.Approval.mapper;
import com.Workneed.workneed.Approval.dto.LeaveRequestDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface LeaveApprovalMapper {

    //휴가 문서 저장
    int leaveSave(LeaveRequestDTO dto);
    Long selectDeptIdByUserId(@Param("userId") Long userId);

    Long findTeamLeaderId(@Param("deptId") Long deptId);

    // ✅ 팀장 결재라인을 APPROVED로 남김(승인함에 보이게)
    int insertApprovedLine(@Param("docId") Long docId,
                           @Param("approverId") Long approverId,
                           @Param("orderNum") Integer orderNum,
                           @Param("approvedAt") LocalDateTime approvedAt);

    int insertLeaveRequest(LeaveRequestDTO dto);

    //디테일
    LeaveRequestDTO selectLeaveDetail(@Param("docId") Long docId);

}
