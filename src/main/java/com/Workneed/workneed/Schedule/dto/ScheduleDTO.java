package com.Workneed.workneed.Schedule.dto;

import java.time.LocalDateTime;

public class ScheduleDTO {
    private Long scheduleId;
    private Long invitedBy;
    private String status;
    private String title;
    private String description;
    private String eventType;  // PROJECT/MEETING/REVIEW/ETC
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String userProfileImage;

    private String location;
    private String type;       // PERSONAL/TEAM/COMPANY
    private Long createdBy;
    private LocalDateTime createdAt;

    public Long getScheduleId() {return scheduleId;}
    public void setScheduleId(Long scheduleId) {this.scheduleId = scheduleId;}

    public Long getInvitedBy() {return invitedBy;}
    public void setInvitedBy(Long invitedBy) {this.invitedBy = invitedBy;}

    public String getStatus() {return status;}
    public void setStatus(String status) {this.status = status;}

    public String getTitle() {return title;}
    public void setTitle(String title) {this.title = title;}

    public String getDescription() {return description;}
    public void setDescription(String description) {this.description = description;}

    public String getEventType() {return eventType;}
    public void setEventType(String eventType) {this.eventType = eventType;}

    public LocalDateTime getStartAt() {return startAt;}
    public void setStartAt(LocalDateTime startAt) {this.startAt = startAt;}

    public LocalDateTime getEndAt() {return endAt;}
    public void setEndAt(LocalDateTime endAt) {this.endAt = endAt;}

    public String getUserProfileImage() {return userProfileImage;}
    public void setUserProfileImage(String userProfileImage) {this.userProfileImage = userProfileImage;}

    public String getLocation() {return location;}
    public void setLocation(String location) {this.location = location;}

    public String getType() {return type;}
    public void setType(String type) {this.type = type;}

    public Long getCreatedBy() {return createdBy;}
    public void setCreatedBy(Long createdBy) {this.createdBy = createdBy;}

    public LocalDateTime getCreatedAt() {return createdAt;}
    public void setCreatedAt(LocalDateTime createdAt) {this.createdAt = createdAt;}
}
