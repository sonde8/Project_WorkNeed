package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO implements Serializable {

    private Long userId;
    private String userLoginId;
    private String userEmail;
    private String userPassword;
    private String userName;
    private String userProfileImage;
    private String userStatus;
    private String userPhone;

    private LocalDateTime userCreatedAt;
    private LocalDateTime userUpdatedAt;
    private LocalDate userBirthday;

    private String rememberToken;
    private LocalDateTime rememberTokenExpired;

    private Long rankId;
    private Long deptId;

    private String deptName;
    private String rankName;

    private String tempPwYn;
}