package com.Workneed.workneed.Approval.entity;

import com.Workneed.workneed.Approval.DocStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class ApprovalDoc {

    private Long docId; // PK (APPROVAL_DOC.approval_doc_id)
    private Long writerId; // FK (USER.user_id)
    private Long typeId;  // FK (APPROVAL_TYPE.type_id)

    private String title;
    private String content;
    private DocStatus status;// DRAFT / SUBMITTED / IN_PROGRESS / REJECTED / COMPLETED

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
