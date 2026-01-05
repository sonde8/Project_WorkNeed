package com.Workneed.workneed.Meetingroom.controller;

import com.Workneed.workneed.Meetingroom.dto.MeetingReservationDTO;
import com.Workneed.workneed.Meetingroom.dto.MeetingRoomStatusDTO;
import com.Workneed.workneed.Meetingroom.service.MeetingRoomService;
import com.Workneed.workneed.Members.dto.UserDTO; // ★ UserDTO Import
import jakarta.servlet.http.HttpSession; // ★ HttpSession Import
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/meeting-rooms")
@RequiredArgsConstructor
public class MeetingRoomController {

    private final MeetingRoomService meetingRoomService;

    // 1. 회의실 현황 조회
    @GetMapping("/status")
    public List<MeetingRoomStatusDTO> getRoomStatus(@RequestParam("date") String date) {
        LocalDate targetDate = LocalDate.parse(date);
        return meetingRoomService.getMeetingRoomStatus(targetDate);
    }

    // 2. 예약 생성 (세션 직접 접근 방식으로 변경)
    @PostMapping("/reservations")
    public void createReservation(
            @RequestBody MeetingReservationDTO request,
            HttpSession session
    ) {
        // 세션에서 user 객체 꺼내기
        UserDTO user = (UserDTO) session.getAttribute("user");

        if (user == null) {
            throw new IllegalStateException("로그인이 필요한 서비스입니다.");
        }

        // 세션에 있는 정확한 ID를 예약자 ID로 주입 (프론트에서 보낸 1 같은 가짜 값 무시)
        Long currentUserId = user.getUserId();
        request.setReserverId(currentUserId);

        log.info("회의실 예약 요청 - UserID: {}, RoomID: {}", currentUserId, request.getRoomId());

        meetingRoomService.reserve(request);
    }
}