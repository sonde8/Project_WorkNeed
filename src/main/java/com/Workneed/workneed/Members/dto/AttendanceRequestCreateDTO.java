package com.Workneed.workneed.Members.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendanceRequestCreateDTO {
    Long userId;
    @JsonFormat(pattern = "yyyy-MM-dd") // 형식 지정
    LocalDate workDate;

    @JsonFormat(pattern = "HH:mm")      // 형식 지정 (24시간제)
    LocalTime fromTime;

    @JsonFormat(pattern = "HH:mm")      // 형식 지정
    LocalTime toTime;
    String reason;
    String rejectReason;
}
