package com.Workneed.workneed.Meetingroom.mapper;

import com.Workneed.workneed.Meetingroom.dto.MeetingReservationDTO;
import com.Workneed.workneed.Meetingroom.dto.MeetingRoomStatusDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface MeetingRoomMapper {

    // 1. 회의실 현황 조회 (09~18 겹치는 예약)
    List<MeetingRoomStatusDTO> findMeetingRoomStatus(
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    // 2. 회의실 예약 중복 체크 (특정 회의실의 시간대 중복 확인)
    int countConflict(
            @Param("roomId") Long roomId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    // 3. 업무 예약 중복 체크 (동일 업무가 이미 다른 회의실을 예약했는지 확인)
    int countScheduleConflict(
            @Param("scheduleId") Long scheduleId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    // 4. 예약 저장
    int insertReservation(MeetingReservationDTO dto);

    // 5. 예약 취소 (삭제)
    int deleteReservation(@Param("reservationId") Long reservationId);

    // 6. task에서 회의실 이름 조회
    String selectRoomNameByScheduleId(@Param("scheduleId") Long scheduleId);

    // 7. task에서 회의실 예약 삭제
    int deleteReservationsByScheduleIds(@Param("scheduleIds") List<Long> scheduleIds);
}