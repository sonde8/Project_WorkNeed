package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDTO {

    // admin
    private Long adminId;
    private String adminEmail;
    private String adminPassword;
    private String adminName;
    private String adminStatus;
    private LocalDateTime adminLastLoginAt;
    private LocalDateTime adminCreatedAt;


   // admin log
    private Long logId;
    private String logActionType;
    private String logTargetType;
    private Long logTargetId;
    private String logBeforeData;
    private String logAfterData;
    private LocalDateTime logCreatedAt;
    //설명
    private String logDescription;


    // admin role
    private String roleDescription;
    private LocalDateTime roleCreatedAt;
    private String roleName;
    private Long roleId;


   // admin permission
    private Long permissionId;
    private String permissionCode;
    private String permissionDescription;
    private LocalDateTime permissionCreatedAt;
}
