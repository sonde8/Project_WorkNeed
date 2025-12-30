package com.Workneed.workneed.Schedule.mapper;

import com.Workneed.workneed.Schedule.dto.TaskMember1PerformanceDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TaskMemberPerformanceMapper {
    // 모달1: 참여자별 진행률 리스트
    List<TaskMember1PerformanceDTO> selectMembersPerformance(@Param("scheduleId") Long scheduleId);

    // 모달1: 상단 현재 진행률 (스케줄 전체 기준)
    Integer selectScheduleProgressRate(@Param("scheduleId") Long scheduleId);
}
