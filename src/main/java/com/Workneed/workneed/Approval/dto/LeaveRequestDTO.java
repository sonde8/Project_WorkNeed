package com.Workneed.workneed.Approval.dto;

import com.Workneed.workneed.Approval.LeaveType;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

@Data
public class LeaveRequestDTO {
    private LeaveType leaveType;     // ANNUAL / HALF_AM / HALF_PM / VACATION
    private Long docId;
    private Long userId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;

    private Double days;

}
