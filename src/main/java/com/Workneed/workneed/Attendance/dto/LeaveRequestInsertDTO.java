package com.Workneed.workneed.Attendance.dto;

import lombok.Data;

@Data
public class LeaveRequestInsertDTO {

    private Long requestId;
    private Long userId;
    private String requestType;
    private String requestPayload;
    private String status;
}
