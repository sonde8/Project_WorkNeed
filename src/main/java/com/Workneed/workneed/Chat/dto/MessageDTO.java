package com.Workneed.workneed.Chat.dto;

import com.Workneed.workneed.Chat.service.FileLogService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private Long messageId;
    private Long roomId;
    private String roomName;
    private Long senderId;
    private String content;
    private String messageType;
    private Long fileLogId;
    private LocalDateTime createdAt;
    private int unreadCount;

    // 발신자 이름 (User 테이블 Join 조회)
    private String senderName;

    // 클라이언트 화면에 표시할 수 있도록 포맷팅된 전송 시간 (오후 3:31)
    private String displayTime;
}
