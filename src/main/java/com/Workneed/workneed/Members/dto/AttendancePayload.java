package com.Workneed.workneed.Members.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendancePayload {
    LocalDate workDate;
    LocalTime fromTime;
    LocalTime toTime;
    String reason;
}