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

    public LeaveRequestDTO getLeaveDetail(Long docId, Long userId) {
        LeaveRequestDTO leave = leaveApprovalMapper.selectLeaveDetail(docId);


        if (leave == null) {
            throw new IllegalStateException("휴가 상세가 없습니다. docId=" + docId);
        }

        // (선택) 보안: 본인 문서만 보이게 막고 싶으면 여기서 검증합니다.
        // if (!leave.getUserId().equals(userId)) {
        //     throw new IllegalStateException("본인 문서만 조회 가능합니다.");
        // }

        return leave;
    }

    @Transactional
    public Long submitLeave(LeaveRequestDTO dto, Long userId) {

        // 1) approval_doc 생성
        ApprovalDoc doc = new ApprovalDoc();
        // 작성자
        doc.setWriterId(userId);
        // 제목(연차 종류)
        doc.setTitle(dto.getLeaveType());
        //타입
        doc.setTypeId(2L); // 휴가

        // 사유
        doc.setContent(dto.getReason());
        //시작일
        doc.setLeaveStartDate(dto.getStartDate());
        //마감일
        doc.setLeaveEndDate(dto.getEndDate());
        //
        doc.setStatus(DocStatus.APPROVED); // 또는 WAITING

        docMapper.save(doc);   // ✅ 타입 일치

        Long docId = doc.getDocId();
        if (docId == null) {
            throw new IllegalStateException("docId 생성 실패 - useGeneratedKeys/keyProperty 설정 확인 필요");
        }


        // 2) leave_request 저장 (✅ LeaveApprovalMapper로)
        dto.setDocId(docId);
        dto.setUserId(userId);
        leaveApprovalMapper.insertLeaveRequest(dto);

        // 3) 팀장 찾기 + 결재라인 APPROVED INSERT
        Long deptId = leaveApprovalMapper.selectDeptIdByUserId(userId);
        Long teamLeadId = leaveApprovalMapper.findTeamLeaderId(deptId);

        if (teamLeadId == null) {
            throw new IllegalStateException("관리자 찾지 못했습니다. deptId=" + deptId);
        }

        // 결재라인 남김
        leaveApprovalMapper.insertApprovedLine(docId, teamLeadId, 1, LocalDateTime.now());

        // 4) doc 승인완료
        docMapper.updateDocStatus(docId, DocStatus.APPROVED);

        return docId;
    }
}
