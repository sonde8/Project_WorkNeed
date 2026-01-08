package com.Workneed.workneed.Attendance.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LeaveApplyDTO {

    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
}
