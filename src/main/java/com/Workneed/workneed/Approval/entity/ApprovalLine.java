package com.Workneed.workneed.Approval.entity;

import com.Workneed.workneed.Approval.LineStatus;
import lombok.Data;

import java.time.LocalDateTime;
@Data
public class ApprovalLine{

    private Long lineId;
    private Long docId;     //문서

    private Long approverId;    //결재자

    private LineStatus status;  //PENDING / WAITING / APPROVED / REJECTED
    private int orderNum;   // 순차/ 병렬

    private LocalDateTime approvedAt;
}