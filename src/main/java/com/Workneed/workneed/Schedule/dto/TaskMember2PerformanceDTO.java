package com.Workneed.workneed.Schedule.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskMember2PerformanceDTO {
    private Long taskId;
    private String taskDescription;
    private String personalStatus; // TODO / DOING
}
