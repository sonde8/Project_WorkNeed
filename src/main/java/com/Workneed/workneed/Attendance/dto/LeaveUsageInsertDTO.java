package com.Workneed.workneed.Attendance.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class LeaveUsageInsertDTO {

    private Long requestId;
    private Long userId;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double days;
    private String reason;
}
