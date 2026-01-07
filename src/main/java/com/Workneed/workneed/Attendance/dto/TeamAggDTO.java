package com.Workneed.workneed.Attendance.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamAggDTO {

    private Long empId;
    private Integer workMin;
    private Integer normalMin;
    private Integer overtimeMin;
    private Integer holidayMin;
    private Integer lateCount;
}
