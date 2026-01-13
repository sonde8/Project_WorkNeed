package com.Workneed.workneed.Approval.dto;

import com.Workneed.workneed.Approval.DocStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class DocDTO {

    private Long docId; // PK (APPROVAL_DOC.approval_doc_id)
    private Long writerId; // FK (USER.user_id)
    private Long typeId;  // FK (APPROVAL_TYPE.type_id)
    private String refUserIds; //참조자
    private String typeName;

    private String title;
    private String content;
    private DocStatus status;// DRAFT / SUBMITTED / IN_PROGRESS / REJECTED / COMPLETED

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ✅ 휴가 문서 필드
    private LocalDate startDate;
    private LocalDate endDate;
    private Double leaveDays;
}
