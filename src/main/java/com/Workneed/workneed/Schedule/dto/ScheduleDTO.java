package com.Workneed.workneed.Schedule.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ScheduleDTO {
    private Long scheduleId;
    private Long invitedBy;
    private String status;
    private String title;
    private String description;
    private String eventType;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String userProfileImage;

    private String location;
    private String type;
    private Long createdBy;
    private LocalDateTime createdAt;

    private String gitUrl;
    private String fileStorageUrl;
}
