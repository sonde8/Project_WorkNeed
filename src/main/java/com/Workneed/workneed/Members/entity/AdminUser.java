package com.Workneed.workneed.Members.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminUser {

    private Long adminId;
    private String adminEmail;
    private String adminPassword;
    private String adminName;
    private Long roleId;
    private String adminStatus;
    private LocalDateTime adminLastLoginAt;
    private LocalDateTime adminCreatedAt;
}
