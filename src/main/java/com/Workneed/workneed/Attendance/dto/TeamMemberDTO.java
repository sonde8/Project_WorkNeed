package com.Workneed.workneed.Attendance.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamMemberDTO {

    private Long userId;
    private String userName;
    private String rankName;

    public String getNameRank(){

        String r = (rankName == null ? "" : rankName);
        return userName + "(" + r + ")";
    }
}
