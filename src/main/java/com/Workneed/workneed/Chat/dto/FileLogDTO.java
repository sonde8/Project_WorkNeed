package com.Workneed.workneed.Chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileLogDTO {
    private Long fileLogId;     // PK
    private Long messageId;     // FK (Message 테이블)
    private Long roomId;        // 채팅방 ID (모아보기 최적화용)
    private String fileName;    // 원본 파일명 (origin_name)
    private String storedName;  // UUID가 붙은 실제 저장 파일명
    private String filePath;    // 웹 접근 경로 (URL)
    private Long fileSize;      // 파일 크기 (Byte)
    private String fileType;
    private LocalDateTime createdAt;
}
