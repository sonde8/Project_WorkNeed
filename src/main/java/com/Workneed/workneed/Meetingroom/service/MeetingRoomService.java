package com.Workneed.workneed.Meetingroom.service;

import com.Workneed.workneed.Meetingroom.dto.MeetingReservationDTO;
import com.Workneed.workneed.Meetingroom.dto.MeetingRoomStatusDTO;
import com.Workneed.workneed.Meetingroom.mapper.MeetingRoomMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MeetingRoomService {

    private final MeetingRoomMapper meetingRoomMapper;

    /**
     * 회의실 현황 조회 (근무시간 09:00~18:00)
     */
    public List<MeetingRoomStatusDTO> getMeetingRoomStatus(LocalDate date) {

        LocalDateTime startAt = date.atTime(9, 0);
        LocalDateTime endAt   = date.atTime(18, 0);

        return meetingRoomMapper.findMeetingRoomStatus(startAt, endAt);
    }

    /**
     * 회의실 예약
     */
    @Transactional
    public void reserve(MeetingReservationDTO dto) {

        // 최소 검증
        if (dto.getRoomId() == null) {
            throw new IllegalArgumentException("회의실은 필수입니다.");
        }
        if (dto.getReserverId() == null) {
            throw new IllegalArgumentException("예약자는 필수입니다.");
        }
        if (dto.getStartAt() == null || dto.getEndAt() == null) {
            throw new IllegalArgumentException("시간은 필수입니다.");
        }

        // 1.중복 체크
        int conflict = meetingRoomMapper.countConflict(
                dto.getRoomId(),
                dto.getStartAt(),
                dto.getEndAt()
        );

        if (conflict > 0) {
            throw new IllegalStateException("이미 예약된 시간입니다.");
        }

        // 2. 저장
        meetingRoomMapper.insertReservation(dto);
    }

    /**
     * 예약 취소
     */
    @Transactional
    public void cancel(Long reservationId, Long requestUserId) {
        // 본인 예약인지 확인하는 로직이 필요하다면 여기서 조회 후 체크 가능
        // 지금은 UI에서 버튼을 본인에게만 보여주므로 바로 삭제 처리
        meetingRoomMapper.deleteReservation(reservationId);
    }
}
