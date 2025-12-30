package com.Workneed.workneed.Schedule.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskMember1PerformanceDTO {
    private Long userId;
    private String userName;
    private String userProfileImage;

    private String deptName;
    private String rankName;
    private String role;

    private int pendingCount;  // TODO  DOING
    private int doneCount;     // DONE
    private int totalCount;    // TODO  DOING done
    private int progressRate;  // done / total * 100
}
