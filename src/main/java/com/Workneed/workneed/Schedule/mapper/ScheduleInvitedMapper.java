package com.Workneed.workneed.Schedule.mapper;


import com.Workneed.workneed.Schedule.dto.ScheduleInvitedDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ScheduleInvitedMapper {
    // Active 유저 조회 (Owner 제외)
    List<ScheduleInvitedDTO> selectActiveUsersExcludeOwner(@Param("scheduleId") Long scheduleId);

    // OWNER 1명 조회
    ScheduleInvitedDTO selectOwnerByScheduleId(@Param("scheduleId") Long scheduleId);

    // MEMBER 리스트 조회 (OWNER 제외)
    List<ScheduleInvitedDTO> selectMembersByScheduleId(@Param("scheduleId") Long scheduleId);
}

