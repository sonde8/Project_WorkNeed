package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminActivityLogDTO {

    private Long logId;
    private Long adminId;
    private String logActionType;
    private String logTargetType;
    private Long logTargetId;
    private String logBeforeData;
    private String logAfterData;
    private LocalDateTime logCreatedAt;
}
