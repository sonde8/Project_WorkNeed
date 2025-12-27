package com.Workneed.workneed.Calendar.dto;

import lombok.Data;

@Data
public class CalendarDTO {

    private Long calendarId;      // calendar_id (PK)
    private Long createdBy;       // created_by (작성자)

    private String title;         // title (제목)
    private String description;   // description (내용)

    private String start;         // start_at
    private String end;           // end_at

    private String type;          // calendar_type (PERSONAL / COMPANY)
    private String color;         // color

    private String createdAt;     // created_at
    private String updatedAt;     // updated_at
}