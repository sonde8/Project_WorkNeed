package com.Workneed.workneed.Attendance.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;


@Data
public class AttendanceDTO {
    private Long attendanceId;
    private Long empId;
    private LocalDate workDate;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private Integer workMinutes;
    private Integer overtimeMinutes;
    private String isLate;
    private String isEarlyLeave;
    private String statusCode;

}
