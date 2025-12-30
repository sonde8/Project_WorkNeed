package com.Workneed.workneed.Meetingroom.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class MeetingRoomStatusDTO {

    private Long roomId;
    private String roomName;

    private List<MeetingReservationDTO> reservations;
}
