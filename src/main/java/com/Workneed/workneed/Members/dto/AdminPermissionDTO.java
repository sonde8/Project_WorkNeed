package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPermissionDTO {

    private Long permissionId;
    private String permissionCode;
    private String permissionDescription;
    private Long roleId;
    private LocalDateTime permissionCreatedAt;
}