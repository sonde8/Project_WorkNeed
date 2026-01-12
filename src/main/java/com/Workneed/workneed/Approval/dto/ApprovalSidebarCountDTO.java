package com.Workneed.workneed.Approval.dto;

import lombok.Data;

@Data
public class ApprovalSidebarCountDTO {

    /* ===============================
       기안자 (내가 작성한 문서)
       =============================== */

    /** 임시저장 (DRAFT) */
    private Integer drafterDraftCount;

    /** 진행중 (IN_PROGRESS) */
    private Integer drafterInProgressCount;

    /** 승인됨 (APPROVED) */
    private Integer drafterApprovedCount;

    /** 반려됨 (REJECTED) */
    private Integer drafterRejectedCount;

    /** 참조됨 (REFERENCE) */
    private Integer drafterReferencedCount;

    /* ===============================
       결재자 (내가 결재자)
       =============================== */

    /** 처리해야할 문서 (내 차례 WAITING) */
    private Integer approverTodoCount;

    /** 처리한 문서 (내가 승인/반려한 문서) */
    private Integer approverDoneCount;
}
