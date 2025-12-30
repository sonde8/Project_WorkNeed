package com.Workneed.workneed.Meetingroom.controller;

import com.Workneed.workneed.Meetingroom.dto.MeetingReservationDTO;
import com.Workneed.workneed.Meetingroom.dto.MeetingRoomStatusDTO;
import com.Workneed.workneed.Meetingroom.service.MeetingRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meeting-rooms")
@RequiredArgsConstructor
public class MeetingRoomController {

    private final MeetingRoomService meetingRoomService;

    /**
     * 회의실 현황 조회
     * date = YYYY-MM-DD
     */
    @GetMapping("/status")
    public List<MeetingRoomStatusDTO> getRoomStatus(
            @RequestParam("date") String date
    ) {
        LocalDate targetDate = LocalDate.parse(date);
        return meetingRoomService.getMeetingRoomStatus(targetDate);
    }

    /**
     * 회의실 예약 생성
     */
    @PostMapping("/reservations")
    public void createReservation(
            @RequestBody MeetingReservationDTO request
    ) {
        meetingRoomService.reserve(request);
    }
}
