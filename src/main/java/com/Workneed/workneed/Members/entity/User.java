package com.Workneed.workneed.Members.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class User {

    private Long userId;
    private String userLoginId;
    private String userEmail;
    private String userPassword;
    private String userName;
    private String userProfileImage;
    private String userStatus;

    private LocalDateTime userCreatedAt;
    private LocalDateTime userUpdatedAt;
    private LocalDate userBirthday;

    private String rememberToken;
    private LocalDateTime rememberTokenExpired;

    private Long rankId;
    private Long deptId;
}