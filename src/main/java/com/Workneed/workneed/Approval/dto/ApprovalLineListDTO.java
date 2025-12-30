package com.Workneed.workneed.Approval.dto;

import com.Workneed.workneed.Approval.LineStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApprovalLineListDTO {

    //선택
    private Long userId;

    // 선택/조회 공통
    private String username;

    //조회
    private Long lineId;
    private Integer orderNum;
    private LineStatus status;    // // PENDING / WAITING / APPROVED / REJECTED
    private LocalDateTime approvedAt;

    //화면 표시
    private String deptName;
    private String rankName;
}
