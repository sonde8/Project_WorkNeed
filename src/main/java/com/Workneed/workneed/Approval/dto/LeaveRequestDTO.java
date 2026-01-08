package com.Workneed.workneed.Approval.dto;

import com.Workneed.workneed.Approval.DocStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LeaveRequestDTO {
    private String leaveType;     // ANNUAL / HALF_AM / HALF_PM

    private LocalDateTime leaveStartDate;
    private LocalDateTime leaveEndDate;

    private String reason;
}
