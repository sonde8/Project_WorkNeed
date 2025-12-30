package com.Workneed.workneed.Schedule.mapper;


import com.Workneed.workneed.Schedule.dto.ScheduleInvitedDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ScheduleInvitedMapper {
    List<ScheduleInvitedDTO> selectActiveUsersExcludeOwner(@Param("scheduleId") Long scheduleId);
}
