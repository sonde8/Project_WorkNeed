package com.Workneed.workneed.Schedule.dto;

import lombok.Getter;
import lombok.Setter;


import java.util.List;

@Getter
@Setter
public class TaskMember2ResponseDTO {

    private Long scheduleId;
    private Long userId;
    private String userName;

    private int pendingCount;
    private int doneCount;

    private List<TaskMember2PerformanceDTO> todoTasks;
    private List<TaskMember2PerformanceDTO> doingTasks;
    private List<TaskMember2PerformanceDTO> doneTasks;
}