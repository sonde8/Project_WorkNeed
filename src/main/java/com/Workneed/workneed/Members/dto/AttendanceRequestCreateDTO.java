package com.Workneed.workneed.Members.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendanceRequestCreateDTO {
    Long userId;
    LocalDate workDate;
    LocalTime fromTime;
    LocalTime toTime;
    String reason;
    String rejectReason;
}
