package com.Workneed.workneed.Approval.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

@Data
public class LeaveRequestDTO {
    private Long docId;   // 생성 후 채워짐
    private Long userId;          // 세션에서 채움

    private String leaveType;     // ANNUAL / HALF_AM / HALF_PM / VACATION

    private LocalDate startDate;

    private LocalDate endDate;

    private LocalDateTime createdAt; // created_at

    private String reason;

    private Double days;

}
