package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRoleDTO {

    private Long roleId;
    private String roleName;
    private String roleDescription;
    private LocalDateTime roleCreatedAt;
}
