package com.Workneed.workneed.Schedule.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MainScheduleDTO {
    private Long scheduleId;
    private String scheduleTitle;
    private String eventType;

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    private Long taskId;
    private String taskStatus;
    private String taskDescription;
}
