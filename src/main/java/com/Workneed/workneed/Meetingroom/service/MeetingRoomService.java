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

    public List<MeetingRoomStatusDTO> getMeetingRoomStatus(LocalDate date) {
        LocalDateTime startAt = date.atTime(9, 0);
        LocalDateTime endAt   = date.atTime(18, 0);
        return meetingRoomMapper.findMeetingRoomStatus(startAt, endAt);
    }

    @Transactional
    public void reserve(MeetingReservationDTO dto) {
        // 0. 필수값 검증
        if (dto.getRoomId() == null) throw new IllegalArgumentException("회의실을 선택해주세요.");
        if (dto.getStartAt() == null || dto.getEndAt() == null) throw new IllegalArgumentException("예약 시간을 입력해주세요.");

        // 1. 회의실 중복 체크 (해당 회의실이 사용 중인지)
        int conflict = meetingRoomMapper.countConflict(dto.getRoomId(), dto.getStartAt(), dto.getEndAt());
        if (conflict > 0) {
            throw new IllegalStateException("선택하신 시간에 이미 해당 회의실 예약이 존재합니다.");
        }

        // 2. 업무 중복 체크 (선택한 업무가 이미 예약되어 있는지)
        if (dto.getScheduleId() != null) {
            int scheduleConflict = meetingRoomMapper.countScheduleConflict(dto.getScheduleId(), dto.getStartAt(), dto.getEndAt());
            if (scheduleConflict > 0) {
                throw new IllegalStateException("해당 업무는 이미 다른 회의실에 예약되어 있습니다.");
            }
        }

        // 3. 저장
        meetingRoomMapper.insertReservation(dto);
    }

    @Transactional
    public void cancel(Long reservationId, Long requestUserId) {
        meetingRoomMapper.deleteReservation(reservationId);
    }
}