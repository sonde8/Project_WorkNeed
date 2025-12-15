package com.Workneed.workneed.Calendar.dto;

import lombok.Data;

@Data
public class CalendarDTO {
    private Long calendarId;
    private String name;
    private Long ownerId;
    private String color;
    private String description;
    private Boolean isActive;
}
