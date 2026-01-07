package com.Workneed.workneed.Attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AttendanceBookDTO {

    private String date;
    private String type;
    private String checkIn;
    private String checkOut;
    private Integer otMin;
    private Integer workMin;
}
