package com.Workneed.workneed.Members.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class LeaveUsage {

    private Long leaveId;
    private Long requestId;
    private Long userId;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double days;
    private String reason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
