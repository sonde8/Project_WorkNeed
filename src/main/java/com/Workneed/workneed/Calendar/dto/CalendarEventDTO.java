package com.Workneed.workneed.Calendar.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CalendarEventDTO {

    private Long id;

    private String title;
    private String description;

    private LocalDateTime start;
    private LocalDateTime end;

    private String type;      // PERSONAL / TEAM / COMPANY
    private String source;    // CALENDAR / SCHEDULE

    private String eventType; // TASK / PROJECT / MEETING
    private String location;
    private String status;
}

