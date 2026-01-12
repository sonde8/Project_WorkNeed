package com.Workneed.workneed.Members.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendanceRequestCreateDTO {

    private Long userId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate workDate;

    // mapper.xml 기준에 맞춤
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private String type;
    private String reason;
    private String rejectReason;
}
