package com.Workneed.workneed.Members.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class Request {

    private Long requestId;
    private Long userId;
    private String requestType;
    private String requestPayload;
    private String status;
    private LocalDateTime requestCreatedAt;
    private LocalDateTime requestUpdatedAt;
    private Long adminId;
}
