package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestDTO {

    private Long requestId;
    private Long userId;
    private String requestType;
    private String requestPayload;
    private String status;
    private LocalDateTime requestCreatedAt;
    private LocalDateTime requestUpdatedAt;
    private Long adminId;
}
