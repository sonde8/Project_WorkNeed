package com.Workneed.workneed.Approval.dto;

import com.Workneed.workneed.Members.dto.UserDTO;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApprovalDocListItemDTO {
    private Long docId;
    private String title;

    private String docStatus;     // DRAFT / IN_PROGRESS / REJECTED / APPROVED
    private LocalDateTime createdAt;

    // 결재함 계열에서 작성자 표시용 (기안함이면 null이어도 됨)
    private String writerUserName;
    private String rankName;

    // 결재함 분리용(필요 시만 채움)
    private String myLineStatus;  // WAITING / PENDING / APPROVED / REJECTED
    private Integer myOrderNum;
    private Integer currentOrder;
}
