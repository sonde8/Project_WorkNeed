package com.Workneed.workneed.Chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatRoomDTO {
    private Long roomId;
    private String roomName;
    private String roomType;
    private Long creatorId;
    private LocalDateTime createdAt;

    // 현재 채팅방에 참여 중인 인원수
    private int userCount;
    // 마지막 메세지의 타입을 저장
    private String lastMessageType;
    // 채팅방 목록에서 미리 보여줄 가장 최근 메세지 내용
    private String lastMessageContent;
    // 채팅방 목록에서 미리 보여줄 마지막 메세지의 전송 시간
    private LocalDateTime lastMessageTime;

    // 사이드 미리보기에 사진, 파일 저장명이 뜨지 않게 하는 구문
    public String getLastMessageContent() {
        if (this.lastMessageContent == null) {
            return this.lastMessageContent != null ? this.lastMessageContent : "새로운 대화가 없습니다.";
        }

        // 타입에 따른 문구 필터링 (공백 제거 및 대문자 비교)
        String type = this.lastMessageType.trim().toUpperCase();

        switch (type) {
            case "IMAGE":
                return "사진을 보냈습니다.";
            case "FILE":
                return "파일을 보냈습니다";
            case "ENTER":
            case "LEAVE":
                return this.lastMessageContent;
            default:
                return this.lastMessageContent;
        }
    }
}
