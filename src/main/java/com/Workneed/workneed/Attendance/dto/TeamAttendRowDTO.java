package com.Workneed.workneed.Attendance.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TeamAttendRowDTO {

    private Long empId;
    private String nameWithRank;

    private String monthTotal;

    private WeekSummaryDTO w1;
    private WeekSummaryDTO w2;
    private WeekSummaryDTO w3;
    private WeekSummaryDTO w4;
    private WeekSummaryDTO w5;
}
