package com.Workneed.workneed.Attendance.dto;

import lombok.Builder;
import lombok.Getter;


@Getter
@Builder
public class WeekSummaryDTO {

    private String normal;
    private String overtime;
    private String holiday;
    private int late;
}
