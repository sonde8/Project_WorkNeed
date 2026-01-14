package com.Workneed.workneed.Approval.dto;

import lombok.Data;


@Data
public class ApprovalLineMailDTO {
    private int orderNum;        // 차수(순서)
    private String stepType;     // 검토/합의/결재/참조
    private String deptName;
    private String rankName;
    private String username;
    private String status;       // 대기/승인/반려 등
    private String approvedAt;   // "2026-01-14 10:11" 같은 문자열 (없으면 "-" 처리)
}