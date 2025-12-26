package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveUsageDTO {

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
