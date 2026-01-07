package com.Workneed.workneed.Attendance.mapper;

import com.Workneed.workneed.Attendance.dto.TeamMemberDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TeamAttendMapper {

    Long findTeamUserId(@Param("userId") Long userId);

    List<TeamMemberDTO> findTeamMembers(@Param("deptId") Long deptId);
}
