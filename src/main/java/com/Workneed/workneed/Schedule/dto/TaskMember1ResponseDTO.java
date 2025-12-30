package com.Workneed.workneed.Schedule.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class TaskMember1ResponseDTO {
    // 현재 진행률
    private int scheduleProgressRate;
    // 참여자별 성과 리스트
    private List<TaskMember1PerformanceDTO> members;
}
