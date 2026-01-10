package com.Workneed.workneed.Members.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendancePayloadDTO {
    LocalDate workDate;
    LocalTime fromTime;
    LocalTime toTime;
    String reason;
    String rejectReason;

    String type;
}