package com.Workneed.workneed.Approval.entity;

import lombok.Data;

@Data
public class User {
    private Long userId;
    private String loginId;
    private String password;
    private String userName;
}
