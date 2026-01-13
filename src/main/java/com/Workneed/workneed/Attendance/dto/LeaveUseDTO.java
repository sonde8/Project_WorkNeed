package com.Workneed.workneed.Attendance.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LeaveUseDTO {

    private Long leaveId;
    private Long requestId;
    private Long userId;

    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;

    private LocalDateTime createdAt;
}
