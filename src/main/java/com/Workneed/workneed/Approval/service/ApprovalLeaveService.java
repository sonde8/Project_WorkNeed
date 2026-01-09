package com.Workneed.workneed.Approval.service;

import com.Workneed.workneed.Approval.DocStatus;
import com.Workneed.workneed.Approval.LeaveType;
import com.Workneed.workneed.Approval.dto.DocDTO;
import com.Workneed.workneed.Approval.dto.LeaveRequestDTO;
import com.Workneed.workneed.Approval.mapper.DocMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApprovalLeaveService {

    private final DocMapper docMapper;

    public ApprovalLeaveService(DocMapper docMapper) {
        this.docMapper = docMapper;
    }

    @Transactional
    public Long submitLeave(LeaveRequestDTO dto, Long userId) {

        DocDTO doc = new DocDTO();
        doc.setWriterId(userId);

        // 제목: 휴가 종류로 가도 되고, "휴가 신청" + 종류로 가도 됩니다.
        doc.setTitle(dto.getLeaveType().getLabel());             // 휴가 타입
        doc.setContent(dto.getReason());
        doc.setStatus(DocStatus.APPROVED);  //자동결재
        doc.setTypeId(1L);
        // ✅ 문서 틀 확장 컬럼에 저장
        doc.setStartDate(dto.getStartDate());
        doc.setEndDate(dto.getEndDate());
        doc.setLeaveDays(dto.getDays());

        docMapper.save(doc);

        if (doc.getDocId() == null) {
            throw new IllegalStateException("docId 생성 실패 - useGeneratedKeys/keyProperty 확인 필요");
        }

        return doc.getDocId();
    }
}
