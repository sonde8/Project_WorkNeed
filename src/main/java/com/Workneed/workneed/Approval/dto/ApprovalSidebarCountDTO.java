package com.Workneed.workneed.Approval.dto;

import lombok.Data;

@Data
public class ApprovalSidebarCountDTO {

    /* ===============================
       기안자 (내가 작성한 문서)
       =============================== */

    /** 내가 작성한 문서 전체 */
    private int drafterAllCount;

    /** 임시저장 (DRAFT) */
    private int drafterDraftCount;

    /** 진행중 (IN_PROGRESS) */
    private int drafterInProgressCount;

    /** 승인됨 (APPROVED) */
    private int drafterApprovedCount;

    /** 반려됨 (REJECTED) */
    private int drafterRejectedCount;


    /* ===============================
       결재자 (내가 결재자)
       =============================== */

    /** 처리해야할 문서 (내 차례 WAITING) */
    private int approverTodoCount;

    /** 처리한 문서 (내가 승인/반려한 문서) */
    private int approverDoneCount;
}
