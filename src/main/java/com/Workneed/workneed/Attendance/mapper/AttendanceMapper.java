package com.Workneed.workneed.Attendance.mapper;

import com.Workneed.workneed.Attendance.dto.AttendanceDTO;
import com.Workneed.workneed.Attendance.dto.TeamAggDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface AttendanceMapper {

    AttendanceDTO findByEmpAndDate(@Param("empId") Long empId,
                                   @Param("workDate") LocalDate workDate);

    int upsertCheckIn(@Param("empId") Long empId,
                      @Param("workDate") LocalDate workDate,
                      @Param("checkInTime") LocalDateTime checkInTime,
                      @Param("isLate") String isLate,
                      @Param("statusCode") String statusCode);

    int updateCheckOut(@Param("empId") Long empId,
                       @Param("workDate") LocalDate workDate,
                       @Param("checkOutTime") LocalDateTime checkOutTime,
                       @Param("workMinutes") Integer workMinutes,
                       @Param("overtimeMinutes") Integer overtimeMinutes,
                       @Param("isEarlyLeave") String isEarlyLeave,
                       @Param("statusCode") String statusCode);

    int workMinutes(@Param("empId") Long empId,
                    @Param("startDate") LocalDate startDate,
                    @Param("endDate") LocalDate endDate);

    int holidayMinutes(@Param("empId") Long empId,
                       @Param("startDate") LocalDate startDate,
                       @Param("endDate") LocalDate endDate);

    // 출근부
    List<AttendanceDTO> timeCard(@Param("empId") Long empId,
                                 @Param("startDate") LocalDate startDate,
                                 @Param("endDate") LocalDate endDate);

    // 출근은 찍었으나 퇴근을 안찍은 사람
    List<AttendanceDTO> findCheckOut(@Param("workDate") LocalDate workDate);

    // 퇴근을 안찍으면 자동 퇴근
    int autoCheckOut(@Param("empId") Long empId,
                     @Param("workDate") LocalDate workDate,
                     @Param("checkOutTime") LocalDateTime checkOutTime,
                     @Param("workMinutes") Integer workMinutes,
                     @Param("overtimeMinutes") Integer overtimeMinutes,
                     @Param("isEarlyLeave") String isEarlyLeave,
                     @Param("statusCode") String statusCode);

    // 어제 자동퇴근이 있을 경우 + 알림 전
    int countAutoCheckout(@Param("empId") Long empId,
                          @Param("workDate") LocalDate workDate);

    // 자동퇴근 후 다음날 메세지 확인 후
    int markCheck(@Param("empId") Long empId,
                  @Param("workDate") LocalDate workDate);


    // 같은 팀 근태
    List<TeamAggDTO> aggTeam(
            @Param("empIds") List<Long> empIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);


    // 근무 일수
    int countWorkDays(@Param("empId") Long empId,
                      @Param("startDate") LocalDate startDate,
                      @Param("endDate") LocalDate endDate);

    // 월 지각
    int countLate(@Param("empId") Long empId,
                  @Param("startDate") LocalDate startDate,
                  @Param("endDate") LocalDate endDate);

    // 월 조퇴
    int countEarlyLeave(@Param("empId") Long empId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

    // 연장근무
    int overtimeMinutes(@Param("empId") Long empId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);
}


