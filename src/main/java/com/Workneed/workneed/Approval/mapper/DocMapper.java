package com.Workneed.workneed.Approval.mapper;


import com.Workneed.workneed.Approval.DocStatus;
import com.Workneed.workneed.Approval.LineStatus;
import com.Workneed.workneed.Approval.entity.User;
import com.Workneed.workneed.Approval.dto.ApprovalLineListDTO;
import com.Workneed.workneed.Approval.dto.ApprovalTypeDTO;
import com.Workneed.workneed.Approval.dto.DocFileDTO;
import com.Workneed.workneed.Approval.entity.ApprovalDoc;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;


@Mapper
public interface DocMapper {
    //저장
    int save(ApprovalDoc doc);
    //조회-디테일 페이지
    ApprovalDoc findById(Long docId);
    //문서 타입 조회
    List<ApprovalTypeDTO>findAllTypes();

    // 제출


    // 결재라인 생성 + 상태 pedding, 순차, 병렬 세팅
    int insertApprovalLine(@Param("docId") Long docId,
                           @Param("approverId") Long approverId,
                           @Param("orderNum") int orderNum,
                           @Param("status") LineStatus status);
    //문서 상테변경
    int submitDoc(@Param("status") DocStatus status,
                  @Param("docId") Long docId);
    // 첫결재자 열어주기 waiting
    int openFirstWaiting(@Param("toStatus") LineStatus toStatus,
                         @Param("fromStatus") LineStatus fromStatus,
                         @Param("docId") Long docId);
    //유저 한개 찾기
    User findLoginUserByLoginId(@Param("loginId") String loginId);

    // 결재자 선택리스트 뿌리기
    List<ApprovalLineListDTO> findLinesByDocId(@Param("docId") Long docId);

    // 결재자 선택하기
    List<ApprovalLineListDTO> findApproverCandidates();

    int countWaitingLineByUser(@Param("docId") Long docId, @Param("userId") Long userId);

    int countApprovedLines(@Param("docId") Long docId);


    // 리젝트
    int rejectCurrentLine(@Param("docId") Long docId);

    int updateDocStatus(@Param("docId") Long docId,
                        @Param("status") DocStatus status);

    int rejectMyWaitingLine(Long docId, Long loginUserId, String comment);
    //승인( 병렬 체크 포함)

    Integer findMyWaitingOrderNum(@Param("docId") Long docId,
                                  @Param("userId") Long userId);

    int approveMyWaitingLine(@Param("docId") Long docId,
                             @Param("userId") Long userId);

    int countWaitingByOrder(@Param("docId") Long docId,
                            @Param("orderNum") Integer orderNum);

    Integer findNextPendingOrderNum(@Param("docId") Long docId);

    int openOrderToWaiting(@Param("docId") Long docId,
                           @Param("orderNum") Integer orderNum);

    // 파일 메타 저장
    void insertFile(DocFileDTO dto);

    // 문서의 파일 목록 조회(이미 있음)
    List<DocFileDTO> selectFilesByDocId(Long docId);

    // 단건 조회(다운로드용)
    DocFileDTO selectFileById(Long fileId);


}

