package com.Workneed.workneed.Approval.service;

import com.Workneed.workneed.Approval.DocStatus;
import com.Workneed.workneed.Approval.LineStatus;
import com.Workneed.workneed.Approval.dto.*;
import com.Workneed.workneed.Approval.entity.ApprovalDoc;
import com.Workneed.workneed.Approval.entity.User;
import com.Workneed.workneed.Approval.mapper.DocMapper;
import com.Workneed.workneed.Chat.service.S3StorageService;
import com.Workneed.workneed.Chat.service.StorageService;
import com.Workneed.workneed.Members.dto.UserDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApprovalService {

    private final DocMapper mapper;
    // s3 업로드를 위한 주입
    private final StorageService storageService;


    public ApprovalService(DocMapper mapper, StorageService storageService) {
        this.mapper = mapper;
        this.storageService = storageService;
    }


    /* ===============================
       문서: 임시저장/조회/타입
       =============================== */

    @Transactional
    public Long save(DocDTO doc) {

        // ✅ 여기서 doc을 다시 dto로 덮어쓰지 않습니다.
        // doc은 Controller에서 이미 세팅되어 들어온다고 가정합니다.

        // 상태만 기본값 강제 (작성 중 문서)
        if (doc.getStatus() == null) {
            doc.setStatus(DocStatus.DRAFT);
        }

        // createdAt/updatedAt은 DB DEFAULT를 믿고 안 넣습니다.
        // (만약 DTO에 필드가 있어도 mapper INSERT에 안 넣으면 DB가 자동 처리)

        mapper.save(doc);

        if (doc.getDocId() == null) {
            throw new IllegalStateException("docId 생성 실패 - useGeneratedKeys/keyProperty 확인 필요");
        }

        return doc.getDocId();
    }

    public DocDTO findById(Long docId) {
        return mapper.findById(docId);
    }

    public List<ApprovalTypeDTO> getTypes() {
        return mapper.findAllTypes();
    }


    // 참조자 조회 ( 추후 참조자 테이블 추가해서 인덱스 향상)
    public List<RefUserDTO> findRefUsersByDocId(Long docId) {

        // 1) docId로 CSV 가져오기
        String csv = mapper.selectRefUserIdsByDocId(docId); // "3,7,12"

        if (csv == null || csv.isBlank()) {
            return List.of();
        }

        // 2) "3,7,12" -> [3,7,12]
        List<Long> ids = Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::valueOf)
                .toList();

        // 3) ids로 유저 한 번에 조회
        return mapper.selectUsersByIds(ids);
    }



    /* ===============================
       제출(상신): 결재라인 생성 + 문서 상태 변경
       =============================== */

    @Transactional
    public void submit(Long docId, List<Long> approverIds, List<Integer> orderNums, List<Long> referenceIds) {

        // 1) 라인 insert (전부 PENDING)
        for (int i = 0; i < approverIds.size(); i++) {
            mapper.insertApprovalLine(
                    docId,
                    approverIds.get(i),
                    orderNums.get(i),
                    LineStatus.PENDING
            );
        }
        // 2) 참조자 저장
        if(referenceIds != null && !referenceIds.isEmpty()) {
            String refUserIds =
                    "," + referenceIds.stream()
                            .distinct()
                            .map(String::valueOf)
                            .collect(Collectors.joining(","))
                            +"," ;
            mapper.updateRefUserIds(docId, refUserIds);
        }

        // 3) 문서 상태 IN_PROGRESS
        mapper.submitDoc(DocStatus.IN_PROGRESS, docId);

        // 4) 첫 차수 WAITING 오픈
        mapper.openFirstWaiting(LineStatus.WAITING, LineStatus.PENDING, docId);
    }


    /* ===============================
       파일:S3저장/ DB 메타 저장
       =============================== */
    public void saveFile(Long docId, List<MultipartFile> files) throws Exception {
        if (files == null || files.isEmpty()) return;

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;

            // 1. S3 업로드 (폴더명 'task'로 저장)
            // S3StorageService.store는 업로드 후 생성된 전체 URL(https://...)을 반환합니다.
            String s3Url = storageService.store(file, "task");

            // 2. 원본 파일명 추출 및 방어 로직
            String originalName = file.getOriginalFilename();
            if (originalName == null || originalName.isBlank()) {
                originalName = "unnamed_file";
            }

            // 3. DB 메타 데이터 저장 (savedName 필드에 긴 S3 URL 저장 가능)
            DocFileDTO dto = new DocFileDTO();
            dto.setDocId(docId);
            dto.setOriginalName(originalName); // 화면에 표시될 원본명
            dto.setSavedName(s3Url);           // S3 전체 접근 경로 (DB TEXT 타입)

            mapper.insertFile(dto);
        }
    }


    /**
     * 문서 기준 파일 목록 조회
     */
    public List<DocFileDTO> getFilesByDocId(Long docId) {
        return mapper.selectFilesByDocId(docId);
    }



    /* ===============================
       로그인
       =============================== */

    public User login(String loginId, String password) {
        User user = mapper.findLoginUserByLoginId(loginId);
        if (user == null) return null;
        if (!password.equals(user.getPassword())) return null;
        return user;
    }


    /* ===============================
       결재: 결재자 후보/라인 조회
       =============================== */

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

    public boolean isReferenceUser(String refUserIds, Long userId) {
        return refUserIds != null && refUserIds.contains("," + userId + ",");
    }

    public boolean existsAnyApprovedLine(Long docId) {
        return mapper.countApprovedLines(docId) > 0;
    }


    /* ===============================
       결재 처리: 반려/승인
       =============================== */

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


    /* ===============================
       ✅ 사이드바 카운트 (기안자/결재자 분리)
       =============================== */

    public ApprovalSidebarCountDTO getCounts(Long userId) {

        ApprovalSidebarCountDTO dto = new ApprovalSidebarCountDTO();


        // 결재자
        dto.setApproverTodoCount(
                mapper.countInboxWaiting(userId)
        );
        dto.setApproverDoneCount(
                mapper.countInboxDone(userId)
        );

        // 기안자
        // dto.setDrafterAllCount(
        //        mapper.countMyAll(userId)
        //);
        dto.setDrafterDraftCount(
                mapper.countMyDraft(userId)
        );
        dto.setDrafterInProgressCount(
                mapper.countMyInProgress(userId)
        );
        dto.setDrafterApprovedCount(
                mapper.countMyApproved(userId)
        );
        dto.setDrafterRejectedCount(
                mapper.countMyRejected(userId)
        );
        dto.setDrafterReferencedCount(
                mapper.countReferenceDocs(userId)
        );
        return dto;
    }

    /* ===============================
       ✅ 리스트: 결재자 문서함 (Inbox)
       =============================== */

    public List<ApprovalDocListItemDTO> getWaitingInbox(Long userId) {
        return mapper.selectInboxWaitingList(userId);
    }

    public List<ApprovalDocListItemDTO> getDoneInbox(Long userId) {
        return mapper.selectInboxDoneList(userId);
    }

    /* ===============================
       ✅ 리스트: 기안자 문서함 (My)
       =============================== */

    /*
    public List<ApprovalDocListItemDTO> getMyAllList(Long userId) {
        return mapper.selectMyAllList(userId);
    }
    */

    public List<ApprovalDocListItemDTO> getMyDraftList(Long userId) {
        return mapper.selectMyDraftList(userId);
    }

    public List<ApprovalDocListItemDTO> getMyInProgressList(Long userId) {
        return mapper.selectMyInProgressList(userId);
    }

    public List<ApprovalDocListItemDTO> getMyApprovedList(Long userId) {
        return mapper.selectMyApprovedList(userId);
    }

    public List<ApprovalDocListItemDTO> getMyRejectedList(Long userId) {
        return mapper.selectMyRejectedList(userId);
    }

    public List<ApprovalDocListItemDTO> getReferenceList(Long userId) {
        return mapper.selectReferenceList(userId);
    }

    public void deleteMyDraft(Long docId, Long userId) {
        int affected = mapper.deleteMyDraft(docId, userId);
        if (affected == 0) {
            throw new IllegalStateException("삭제할 임시저장 문서가 없거나 권한이 없습니다.");
        }
    }
}