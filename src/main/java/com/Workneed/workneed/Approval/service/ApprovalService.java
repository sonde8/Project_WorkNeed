package com.Workneed.workneed.Approval.service;

import com.Workneed.workneed.Approval.*;
import com.Workneed.workneed.Approval.dto.ApprovalLineListDTO;
import com.Workneed.workneed.Approval.dto.ApprovalTypeDTO;
import com.Workneed.workneed.Approval.dto.DocDTO;
import com.Workneed.workneed.Approval.dto.DocFileDTO;
import com.Workneed.workneed.Approval.entity.ApprovalDoc;
import com.Workneed.workneed.Approval.entity.User;
import com.Workneed.workneed.Approval.mapper.DocMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApprovalService {

    private final DocMapper mapper;

    // ✅ application.properties 값 주입
    @Value("${file.upload-dir}")
    private String uploadDir;

    public ApprovalService(DocMapper mapper) {
        this.mapper = mapper;
    }

    // =====================
    // 임시저장
    // =====================
    public Long save(DocDTO dto) {

        Long writerId = 5L; // TODO: 나중에 session에서 받기

        ApprovalDoc doc = new ApprovalDoc();
        doc.setWriterId(writerId);
        doc.setTitle(dto.getTitle());
        doc.setTypeId(dto.getTypeId());
        doc.setContent(dto.getContent());
        doc.setStatus(DocStatus.DRAFT);
        doc.setCreatedAt(LocalDateTime.now());
        doc.setUpdatedAt(LocalDateTime.now());

        mapper.save(doc);
        return doc.getDocId();
    }

    // =====================
    // 문서 조회
    // =====================
    public ApprovalDoc findById(Long docId) {
        return mapper.findById(docId);
    }

    public List<ApprovalTypeDTO> getTypes() {
        return mapper.findAllTypes();
    }

    // =====================
    // 제출
    // =====================
    @Transactional
    public void submit(Long docId, List<Long> approverIds, List<Integer> orderNums) {

        // 1) 라인 insert (전부 PENDING)
        for (int i = 0; i < approverIds.size(); i++) {
            mapper.insertApprovalLine(
                    docId,
                    approverIds.get(i),
                    orderNums.get(i),
                    LineStatus.PENDING
            );
        }

        // 2) 문서 상태 IN_PROGRESS
        mapper.submitDoc(DocStatus.IN_PROGRESS, docId);

        // 3) 첫 차수 WAITING 오픈
        mapper.openFirstWaiting(LineStatus.WAITING, LineStatus.PENDING, docId);
    }

    // =====================
    // ✅ 파일 저장 (단순 버전)
    // =====================
    public void saveFile(Long docId, List<MultipartFile> files) throws Exception {

        System.out.println("=== 파일 저장 진입 ===");
        System.out.println("uploadDir = " + uploadDir);

        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String original = file.getOriginalFilename();
            if (original == null || original.isBlank()) {
                original = "file";
            }

            // 문서 기준으로만 묶는다
            String savedName = docId + "_" + original;

            file.transferTo(new File(dir, savedName));
        }
    }


    // =====================
    // 로그인
    // =====================
    public User login(String loginId, String password) {
        User user = mapper.findLoginUserByLoginId(loginId);
        if (user == null) return null;
        if (!password.equals(user.getPassword())) return null;
        return user;
    }

    // =====================
    // 결재 관련
    // =====================
    public List<ApprovalLineListDTO> getApproverCandidates() {
        return mapper.findApproverCandidates();
    }

    public List<ApprovalLineListDTO> findLinesByDocId(Long docId) {
        return mapper.findLinesByDocId(docId);
    }

    public boolean isMyTurn(Long docId, Long userId) {
        if (userId == null) return false;
        return mapper.countWaitingLineByUser(docId, userId) > 0;
    }

    public boolean existsAnyApprovedLine(Long docId) {
        return mapper.countApprovedLines(docId) > 0;
    }

    @Transactional
    public void reject(Long docId, Long loginUserId, String comment) {

        Integer orderNum = mapper.findMyWaitingOrderNum(docId, loginUserId);
        if (orderNum == null) {
            throw new IllegalStateException("반려 권한이 없습니다.");
        }

        mapper.rejectMyWaitingLine(docId, loginUserId, comment);
        mapper.updateDocStatus(docId, DocStatus.REJECTED);
    }

    @Transactional
    public void approve(Long docId, Long loginUserId) {

        Integer myOrderNum = mapper.findMyWaitingOrderNum(docId, loginUserId);
        if (myOrderNum == null) {
            throw new IllegalStateException("현재 결재 차례가 아닙니다.");
        }

        mapper.approveMyWaitingLine(docId, loginUserId);

        int waitingLeft = mapper.countWaitingByOrder(docId, myOrderNum);
        if (waitingLeft > 0) return;

        Integer nextOrder = mapper.findNextPendingOrderNum(docId);
        if (nextOrder != null) {
            mapper.openOrderToWaiting(docId, nextOrder);
            return;
        }

        mapper.updateDocStatus(docId, DocStatus.APPROVED);
    }
    // 파일 찾기
    public List<DocFileDTO> getFilesByDocId(Long docId) {
        return mapper.selectFilesByDocId(docId);
    }



}
