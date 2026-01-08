package com.Workneed.workneed.Attendance.mapper;

import com.Workneed.workneed.Attendance.dto.LeaveRequestInsertDTO;
import com.Workneed.workneed.Attendance.dto.LeaveTeamUseDTO;
import com.Workneed.workneed.Attendance.dto.LeaveUsageInsertDTO;
import com.Workneed.workneed.Attendance.dto.LeaveUseDTO;
import com.Workneed.workneed.Members.dto.LeaveUsageDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface LeaveMapper {

   int insertRequest(LeaveRequestInsertDTO dto);

   int insertLeaveUsage(LeaveUsageInsertDTO dto);

   // 연차관리 표
   List<LeaveUseDTO> selectLeaveUsage(@Param("userId") Long userId,
                                      @Param("start") LocalDate start,
                                      @Param("end") LocalDate end);

   //
   LocalDate selectUserJoinDate(@Param("userId") Long userId);

   // 동일 날짜 연차 방지
    int countOver(@Param("userId") Long userId,
                  @Param("startDate") LocalDate startDate,
                  @Param("endDate") LocalDate endDate);

    // 팀 연차
    Long selectDeptIdByUserId(@Param("userId") Long userId);

    List<LeaveTeamUseDTO> selectDeptLeaveUsage(@Param("deptId") Long deptId,
                                               @Param("start") LocalDate start,
                                               @Param("end") LocalDate end,
                                               @Param("name") String name);
}
