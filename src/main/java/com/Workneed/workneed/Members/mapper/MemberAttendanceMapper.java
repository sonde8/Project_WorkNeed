package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.dto.MemberAttendanceDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;

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
}