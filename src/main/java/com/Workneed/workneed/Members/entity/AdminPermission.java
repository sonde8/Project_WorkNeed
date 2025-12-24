package com.Workneed.workneed.Members.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminPermission {

    private Long permissionId;
    private String permissionCode;
    private String permissionDescription;
    private Long roleId;
    private LocalDateTime permissionCreatedAt;
}