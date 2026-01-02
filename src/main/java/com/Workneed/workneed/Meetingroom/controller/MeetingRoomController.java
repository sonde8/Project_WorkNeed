package com.Workneed.workneed.Meetingroom.controller;

import com.Workneed.workneed.Meetingroom.dto.MeetingReservationDTO;
import com.Workneed.workneed.Meetingroom.dto.MeetingRoomStatusDTO;
import com.Workneed.workneed.Meetingroom.service.MeetingRoomService;
import com.Workneed.workneed.config.CustomUserDetails; // ★ 필수 Import
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/meeting-rooms")
@RequiredArgsConstructor
public class MeetingRoomController {

    private final MeetingRoomService meetingRoomService;

    // 1. 회의실 현황 조회 (로그인 안 해도 볼 수 있다면 AuthenticationPrincipal 제외, 필수라면 추가)
    @GetMapping("/status")
    public List<MeetingRoomStatusDTO> getRoomStatus(@RequestParam("date") String date) {
        LocalDate targetDate = LocalDate.parse(date);
        return meetingRoomService.getMeetingRoomStatus(targetDate);
    }

    // 2. 예약 생성
    @PostMapping("/reservations")
    public void createReservation(
            @RequestBody MeetingReservationDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null || userDetails.getUserDto() == null) {
            throw new IllegalStateException("로그인이 필요한 서비스입니다.");
        }

        // 세션에서 ID 꺼내서 DTO에 덮어씌우기
        Long currentUserId = userDetails.getUserDto().getUserId();
        request.setReserverId(currentUserId);

        log.info("회의실 예약 요청 - UserID: {}, RoomID: {}", currentUserId, request.getRoomId());

        meetingRoomService.reserve(request);
    }
}