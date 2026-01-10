package com.Workneed.workneed.Approval.mapper;

import com.Workneed.workneed.Approval.DocStatus;
import com.Workneed.workneed.Approval.LineStatus;
import com.Workneed.workneed.Approval.dto.*;
import com.Workneed.workneed.Approval.entity.ApprovalDoc;
import com.Workneed.workneed.Approval.entity.User;
import com.Workneed.workneed.Members.dto.UserDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DocMapper {

    /* ===============================
       문서: 저장/조회/타입
       =============================== */

    // 저장
    int save(DocDTO dto);

    // 단건 조회 (디테일)
    DocDTO findById(@Param("docId") Long docId);

    // 참조자 조회
    String selectRefUserIdsByDocId(@Param("docId") Long docId);
    List<RefUserDTO>  selectUsersByIds(@Param("ids") List<Long> ids);


    // 문서 타입 목록
    List<ApprovalTypeDTO> findAllTypes();


    /* ===============================
       제출(상신): 문서/결재라인 생성, 상태 세팅
       =============================== */

    // 결재라인 생성 (PENDING/WAITING 등 세팅)
    int insertApprovalLine(@Param("docId") Long docId,
                           @Param("approverId") Long approverId,
                           @Param("orderNum") int orderNum,
                           @Param("status") LineStatus status);

    // 문서 상태 변경 (DRAFT -> IN_PROGRESS)
    int submitDoc(@Param("status") DocStatus status,
                  @Param("docId") Long docId);

    // 첫 결재자 WAITING 열기
    int openFirstWaiting(@Param("toStatus") LineStatus toStatus,
                         @Param("fromStatus") LineStatus fromStatus,
                         @Param("docId") Long docId);


    /* ===============================
       로그인/유저 조회
       =============================== */

    // 로그인 유저 조회
    User findLoginUserByLoginId(@Param("loginId") String loginId);

    int updateRefUserIds(@Param("docId")Long docId,
                         @Param("refUserIds") String refUserIds);
    /* ===============================
       결재선/결재자 후보
       =============================== */

    // 문서별 결재 라인 조회
    List<ApprovalLineListDTO> findLinesByDocId(@Param("docId") Long docId);

    // 결재자 후보 리스트
    List<ApprovalLineListDTO> findApproverCandidates();


    /* ===============================
       결재 처리: 승인/반려/병렬/순차 로직
       =============================== */

    int countWaitingLineByUser(@Param("docId") Long docId,
                               @Param("userId") Long userId);

    int countApprovedLines(@Param("docId") Long docId);

    // 문서 상태 변경 (공용)
    int updateDocStatus(@Param("docId") Long docId,
                        @Param("status") DocStatus status);

    // 반려 처리 (내 WAITING 라인)
    int rejectMyWaitingLine(@Param("docId") Long docId,
                            @Param("userId") Long userId,
                            @Param("comment") String comment);

    // 내 WAITING 라인의 orderNum
    Integer findMyWaitingOrderNum(@Param("docId") Long docId,
                                  @Param("userId") Long userId);

    // 내 WAITING 라인 승인
    int approveMyWaitingLine(@Param("docId") Long docId,
                             @Param("userId") Long userId);

    // 같은 orderNum WAITING 남은 개수(병렬 체크)
    int countWaitingByOrder(@Param("docId") Long docId,
                            @Param("orderNum") Integer orderNum);

    // 다음으로 열어야 할 차수(PENDING 중 최소)
    Integer findNextPendingOrderNum(@Param("docId") Long docId);

    // 특정 차수 전체를 WAITING으로 오픈
    int openOrderToWaiting(@Param("docId") Long docId,
                           @Param("orderNum") Integer orderNum);


    /* ===============================
       파일: 저장/조회
       =============================== */

    // 파일 메타 저장
    void insertFile(DocFileDTO dto);

    // 문서의 파일 목록 조회
    List<DocFileDTO> selectFilesByDocId(Long docId);

    // 파일 단건 조회(다운로드용)
    DocFileDTO selectFileById(Long fileId);

    // ✅ 파일 단일 삭제(삭제 버튼)
    int deleteFileById(Long fileId);

    // ✅ 문서 기준 전체 삭제(문서 삭제/초기화/문서당 1개 정책에서 교체 업로드)
    int deleteFilesByDocId(Long docId);

    /* ==========================================================
       5) ✅ 기안자 문서함 (writer 기준, 문서 status 기준)
       - counts
       ========================================================== */

    //int countMyAll(@Param("userId") Long userId);

    int countMyDraft(@Param("userId") Long userId);

    int countMyInProgress(@Param("userId") Long userId);

    int countMyApproved(@Param("userId") Long userId);

    int countMyRejected(@Param("userId") Long userId);

    int countReferenceDocs(@Param("userId") Long userId);

    /* ==========================================================
       6) ✅ 기안자 문서함 (lists)
       ========================================================== */

    List<ApprovalDocListItemDTO> selectMyAllList(@Param("userId") Long userId);

    List<ApprovalDocListItemDTO> selectMyDraftList(@Param("userId") Long userId);

    List<ApprovalDocListItemDTO> selectMyInProgressList(@Param("userId") Long userId);

    List<ApprovalDocListItemDTO> selectMyApprovedList(@Param("userId") Long userId);

    List<ApprovalDocListItemDTO> selectMyRejectedList(@Param("userId") Long userId);

    List<ApprovalDocListItemDTO> selectReferenceList(@Param("userId") Long userId);

    /* ==========================================================
       7) ✅ 결재자 문서함 (approver 기준, 라인 status 기준)
       - counts
       ========================================================== */

    int countInboxWaiting(@Param("userId") Long userId);

    int countInboxDone(@Param("userId") Long userId);

    /* ==========================================================
       8) ✅ 결재자 문서함 (lists)
       ========================================================== */

    List<ApprovalDocListItemDTO> selectInboxWaitingList(@Param("userId") Long userId);

    List<ApprovalDocListItemDTO> selectInboxDoneList(@Param("userId") Long userId);


    /* ==========================================================
       9) (선택) 임시저장 삭제 등 기존 로직이 있다면 유지
       ========================================================== */

    int deleteMyDraft(@Param("docId") Long docId,
                      @Param("userId") Long userId);



}
