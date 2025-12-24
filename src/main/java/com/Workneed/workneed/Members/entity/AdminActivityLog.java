package com.Workneed.workneed.Members.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminActivityLog {

    private Long logId;
    private Long adminId;
    private String logActionType;
    private String logTargetType;
    private Long logTargetId;
    private String logBeforeData;
    private String logAfterData;
    private LocalDateTime logCreatedAt;
}
