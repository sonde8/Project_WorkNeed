package com.Workneed.workneed.Schedule.service;

import com.Workneed.workneed.Schedule.dto.TaskMember1ResponseDTO;
import com.Workneed.workneed.Schedule.mapper.TaskMemberPerformanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskMemberPerformanceService {

    private final TaskMemberPerformanceMapper mapper;

    public TaskMember1ResponseDTO getModal1Data(Long scheduleId) {

        TaskMember1ResponseDTO response = new TaskMember1ResponseDTO();

        // 상단 전체 진행률
        Integer rate = mapper.selectScheduleProgressRate(scheduleId);
        response.setScheduleProgressRate(rate == null ? 0 : rate);

        // 참여자별 리스트
        response.setMembers(mapper.selectMembersPerformance(scheduleId));

        return response;
    }
}