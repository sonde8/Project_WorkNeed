package com.Workneed.workneed.Meetingroom.controller;

import com.Workneed.workneed.Meetingroom.dto.MeetingReservationDTO;
import com.Workneed.workneed.Meetingroom.dto.MeetingRoomStatusDTO;
import com.Workneed.workneed.Meetingroom.service.MeetingRoomService;
import com.Workneed.workneed.Members.dto.UserDTO;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

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

    // 2. 예약 생성 (수정: ResponseEntity를 사용하여 에러 응답 제어)
    @PostMapping("/reservations")
    public ResponseEntity<?> createReservation(
            @RequestBody MeetingReservationDTO request,
            HttpSession session
    ) {
        try {
            UserDTO user = (UserDTO) session.getAttribute("user");

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "로그인이 필요한 서비스입니다."));
            }

            Long currentUserId = user.getUserId();
            request.setReserverId(currentUserId);

            log.info("회의실 예약 요청 - UserID: {}, RoomID: {}", currentUserId, request.getRoomId());

            meetingRoomService.reserve(request);
            return ResponseEntity.ok().build();

        } catch (IllegalStateException e) {

            log.warn("예약 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("예약 처리 중 서버 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
        }
    }

    // 3. 예약 취소
    @DeleteMapping("/reservations/{reservationId}")
    public ResponseEntity<?> cancelReservation(
            @PathVariable Long reservationId,
            HttpSession session
    ) {
        try {
            UserDTO user = (UserDTO) session.getAttribute("user");
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "로그인이 필요합니다."));
            }

            meetingRoomService.cancel(reservationId, user.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}