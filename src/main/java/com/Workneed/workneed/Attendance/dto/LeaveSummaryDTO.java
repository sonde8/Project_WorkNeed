package com.Workneed.workneed.Attendance.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaveSummaryDTO {

    private String totalLeave;
    private String usedLeave;
    private String remainLeave;
    private String carryLeave;

    //
    private Integer totalMin;
    private Integer usedMin;
    private Integer remainMin;
    private Integer carryMin;
}
