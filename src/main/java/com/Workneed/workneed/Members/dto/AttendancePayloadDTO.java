package com.Workneed.workneed.Members.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendancePayloadDTO {
    private LocalDate workDate;
    private LocalTime fromTime;
    private LocalTime toTime;
    private String reason;
    private String rejectReason;
    private String type;
}