package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

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

    private String deptname;      // 부서 이름
    private String rankname;      // 직급
}