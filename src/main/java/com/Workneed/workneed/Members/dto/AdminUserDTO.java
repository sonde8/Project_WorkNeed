package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDTO {

    private Long adminId;
    private String adminEmail;
    private String adminPassword;
    private String adminName;
    private Long roleId;
    private String adminStatus;
    private String roleName;
    private LocalDateTime adminLastLoginAt;
    private LocalDateTime adminCreatedAt;
}
