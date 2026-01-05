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

    // 2. 예약 중복 체크
    int countConflict(
            @Param("roomId") Long roomId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    // 3. 예약 저장
    int insertReservation(MeetingReservationDTO dto);

    //4. task에서 회의실 내용 조회
    String selectRoomNameByScheduleId(@Param("scheduleId") Long scheduleId);

    //5. task에서 회의실 내용 삭제
    int deleteReservationsByScheduleIds(@Param("scheduleIds") List<Long> scheduleIds);
}
