package com.Workneed.workneed.Chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

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
    private int unreadCount;

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
        // 1. 메시지 내용이 아예 없는 경우 (새 방 등)
        if (this.lastMessageContent == null) {
            return "새로운 대화가 없습니다.";
        }

        // 2. [에러 해결 핵심] 타입이 null인 경우 기본 텍스트 반환
        if (this.lastMessageType == null) {
            return this.lastMessageContent;
        }

        // 3. 타입에 따른 문구 필터링
        String type = this.lastMessageType.trim().toUpperCase();

        switch (type) {
            case "IMAGE":
                return "사진을 보냈습니다.";
            case "FILE":
                return "파일을 보냈습니다.";
            case "ENTER":
            case "LEAVE":
                return this.lastMessageContent;
            default:
                return this.lastMessageContent;
        }
    }

    // 사이드바에 채팅방 날짜 정보를 위한 코드
    public String getLastMessageDisplayTime() {
        if (this.lastMessageTime == null) return null;

        LocalDateTime now = LocalDateTime.now();
        LocalDate msgDate = this.lastMessageTime.toLocalDate();
        LocalDate today = now.toLocalDate();

        if (msgDate.equals(today)) {
            return this.lastMessageTime.format(DateTimeFormatter.ofPattern("a h:mm", Locale.KOREAN));
        }

        if (msgDate.equals(today.minusDays(1))) {
            return "어제";
        }

        if (msgDate.getYear() == today.getYear()) {
            return this.lastMessageTime.format(DateTimeFormatter.ofPattern("M월 d일"));
        }

        return this.lastMessageTime.format(DateTimeFormatter.ofPattern("yyyy.MM.dd"));
    }
}
