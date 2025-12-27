package com.Workneed.workneed.Schedule.dto;

public class ScheduleInvitedDTO {
    private Long userId;
    private String userName;
    private String deptName;
    private String rankName;
    private String userEmail;
    private String userStatus; // ENUM이지만 Java에서는 보통 String으로 받음 (또는 enum으로 정의)

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getDeptName() { return deptName; }
    public void setDeptName(String deptName) { this.deptName = deptName; }

    public String getRankName() { return rankName; }
    public void setRankName(String rankName) { this.rankName = rankName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserStatus() { return userStatus; }
    public void setUserStatus(String userStatus) { this.userStatus = userStatus; }
}
