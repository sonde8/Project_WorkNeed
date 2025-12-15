package com.Workneed.workneed.Calendar.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ScheduleDTO {
    private Long scheduleId;
    private Long calendarId;
    private Long createdBy;
    private Long invitedBy;

    private String title;
    private String description;
    private String eventType;
    private String status;

    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Boolean isAllDay;

    private String location;
    private LocalDateTime createdAt;
    private String type;

    private String fileStorageUrl;
    private String gitUrl;
    private String googleEventId;
}
