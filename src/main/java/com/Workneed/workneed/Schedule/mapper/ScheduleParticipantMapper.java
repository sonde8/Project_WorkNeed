package com.Workneed.workneed.Schedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ScheduleParticipantMapper {

    int inviteOwner(@Param("scheduleId") Long scheduleId,
                    @Param("userId") Long userId);

    int inviteTeam(@Param("scheduleId") Long scheduleId,
                   @Param("userIds") List<Long> userIds);

    int inviteCompany(@Param("scheduleId") Long scheduleId,
                      @Param("ownerId") Long ownerId);
}
