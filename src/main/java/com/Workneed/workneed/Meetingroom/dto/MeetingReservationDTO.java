package com.Workneed.workneed.Meetingroom.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MeetingReservationDTO {

    private Long reservationId;
    private Long roomId;
    private Long scheduleId;
    private Long reserverId;

    private String title;
    private String description;

    private LocalDateTime startAt;
    private LocalDateTime endAt;
}
