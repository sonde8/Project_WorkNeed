package com.Workneed.workneed.Chat.mapper;

import com.Workneed.workneed.Chat.dto.FileLogDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FileLogMapper {
    // 1. 파일 정보 저장 (message_id 없이 저장)
    int insertFileLog(FileLogDTO fileLog);

    // 1-2 메세지 전송 완료 후 호출 (message_id 연결)
    void updateMessageId(@Param("fileLogId") Long fileLogId, @Param("messageId") Long messageId);

    // 2. 특정 채팅방의 파일 목록 조회 (사이드바 모아보기용)
    List<FileLogDTO> findFilesByRoomId(Long roomId);

    // 3. 파일 ID로 단건 정보 조회 다운로드
    FileLogDTO selectFileLogById(Long fileLogId);
}
