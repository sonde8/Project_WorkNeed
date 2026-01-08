package com.Workneed.workneed.Approval.service;

import com.Workneed.workneed.Approval.DocStatus;
import com.Workneed.workneed.Approval.dto.LeaveRequestDTO;
import com.Workneed.workneed.Approval.entity.ApprovalDoc;
import com.Workneed.workneed.Approval.mapper.DocMapper;
import com.Workneed.workneed.Approval.mapper.LeaveApprovalMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ApprovalLeaveService {

    private final DocMapper docMapper;
    private final LeaveApprovalMapper leaveApprovalMapper;

    public ApprovalLeaveService(DocMapper docMapper, LeaveApprovalMapper leaveApprovalMapper) {
        this.docMapper = docMapper;
        this.leaveApprovalMapper = leaveApprovalMapper;
    }

    @Transactional
    public Long submitLeave(LeaveRequestDTO dto, Long userId) {

        // 1) approval_doc 생성
        ApprovalDoc doc = new ApprovalDoc();
        doc.setWriterId(userId);
        doc.setTypeId(1L);
        doc.setTitle("휴가 신청");
        doc.setContent(dto.getReason());
        doc.setStatus(DocStatus.APPROVED); // 또는 WAITING

        docMapper.save(doc);   // ✅ 타입 일치

        Long docId = doc.getDocId();
        if (docId == null) {
            throw new IllegalStateException("docId 생성 실패 - useGeneratedKeys/keyProperty 설정 확인 필요");
        }


        // 2) leave_request 저장 (✅ LeaveApprovalMapper로)
        dto.setDocId(docId);
        leaveApprovalMapper.insertLeaveRequest(dto);

        // 3) 팀장 찾기 + 결재라인 APPROVED INSERT
        Long deptId = leaveApprovalMapper.selectDeptIdByUserId(userId);
        Long teamLeadId = leaveApprovalMapper.findTeamLeaderId(deptId);

        if (teamLeadId == null) {
            throw new IllegalStateException("팀장(차장) 사용자를 찾지 못했습니다. deptId=" + deptId);
        }

        leaveApprovalMapper.insertApprovedLine(docId, teamLeadId, 1, LocalDateTime.now());

        // 4) doc 승인완료
        docMapper.updateDocStatus(docId, DocStatus.APPROVED);

        return docId;
    }
}
