package com.Workneed.workneed.Members.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {   // ✅
    Long attendanceId;
    Long empId;
    LocalDate workDate;
    LocalDateTime checkInTime;
    LocalDateTime checkOutTime;
    Integer workMinutes;
    Integer overtimeMinutes;
    String statusCode;
}