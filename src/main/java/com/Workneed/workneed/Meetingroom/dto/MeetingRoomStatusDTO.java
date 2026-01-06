package com.Workneed.workneed.Meetingroom.dto;

import lombok.Data;
import java.util.List;

@Data
public class MeetingRoomStatusDTO {

    private Long roomId;
    private String roomName;
    private String imagePath;

    private List<MeetingReservationDTO> reservations;
}
