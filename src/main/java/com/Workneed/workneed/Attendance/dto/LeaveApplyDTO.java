package com.Workneed.workneed.Attendance.dto;

import com.Workneed.workneed.Approval.LeaveType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LeaveApplyDTO {

    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private Double days;
}
