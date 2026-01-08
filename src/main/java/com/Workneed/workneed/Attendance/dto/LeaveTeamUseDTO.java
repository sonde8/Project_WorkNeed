package com.Workneed.workneed.Attendance.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LeaveTeamUseDTO {

    private Long leaveId;
    private Long requestId;
    private Long userId;

    private String userName;
    private String rankName;

    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double days;
    private String reason;

    private String status;
    private LocalDateTime createdAt;
}
