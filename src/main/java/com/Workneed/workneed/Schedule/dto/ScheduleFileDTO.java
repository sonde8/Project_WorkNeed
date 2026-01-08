package com.Workneed.workneed.Schedule.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleFileDTO {
    private Long fileId;
    private Long scheduleId;
    private String storedName;
    private String originalName;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private Long uploadedBy;
    private LocalDateTime uploadedAt;
}

