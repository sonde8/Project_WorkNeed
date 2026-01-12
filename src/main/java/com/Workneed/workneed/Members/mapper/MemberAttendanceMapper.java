package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.dto.MemberAttendanceDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Mapper
public interface MemberAttendanceMapper {

    MemberAttendanceDTO findByUserAndDate(
            @Param("userId") Long userId,
            @Param("workDate") LocalDate workDate
    );

    void updateOvertime(
            @Param("attendanceId") Long attendanceId,
            @Param("minutes") int minutes
    );

    void insertOvertime(
            @Param("userId") Long userId,
            @Param("workDate") LocalDate workDate,
            @Param("minutes") int minutes
    );

    void updateCheckIn(@Param("attendanceId") Long attendanceId,
                       @Param("checkInTime") LocalDateTime checkInTime);

    void updateCheckOut(@Param("attendanceId") Long attendanceId,
                        @Param("checkOutTime") LocalDateTime checkOutTime);

    void insertCheckIn(
            @Param("userId") Long userId,
            @Param("workDate") LocalDate workDate,
            @Param("checkInTime") LocalDateTime checkInTime
    );

    void insertCheckOut(
            @Param("userId") Long userId,
            @Param("workDate") LocalDate workDate,
            @Param("checkOutTime") LocalDateTime checkOutTime
    );

    void updateWorkAndOvertime(
            @Param("attendanceId") Long attendanceId,
            @Param("workMinutes") int workMinutes,
            @Param("overtimeMinutes") int overtimeMinutes
    );

    void updateCalculatedFields(
            @Param("attendanceId") Long attendanceId,
            @Param("workMinutes") int workMinutes,
            @Param("overtimeMinutes") int overtimeMinutes,
            @Param("isLate") String isLate,
            @Param("isEarlyLeave") String isEarlyLeave,
            @Param("statusCode") String statusCode
    );
}