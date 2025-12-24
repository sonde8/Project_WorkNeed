package com.Workneed.workneed.Members.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminRole {

    private Long roleId;
    private String roleName;
    private String roleDescription;
    private LocalDateTime roleCreatedAt;
}
