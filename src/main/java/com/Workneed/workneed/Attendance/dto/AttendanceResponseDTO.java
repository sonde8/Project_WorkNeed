package com.Workneed.workneed.Attendance.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AttendanceResponseDTO {

    // 당일
    private String todayCheckIn;
    private String todayCheckOut;
    private String todayStatusText;

    // 월, 주 누적
    private int weekWorkMin;
    private int monthWorkMin;
    private int holidayWorkMin;

    private String weekTotal;
    private String monthTotal;
    private String holidayTotal;

    // 남은 근무, 연장 근무
    private String remainWork;
    private String remainOt;
    private boolean over52;

    // 주간 바
    private int weekPercent;
    private String progressText;
}
