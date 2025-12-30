package com.Workneed.workneed.Chat.controller;

import com.Workneed.workneed.Chat.dto.MessageDTO;
import com.Workneed.workneed.Chat.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @Autowired
    private ChatService chatService;

    /**
     * 실시간 메시지 발신 처리
     * 클라이언트(Socket.js)에서 /pub/chat/sendMessage로 요청 시 호출
     */
    @MessageMapping("/chat/sendMessage")
    public void sendMessage(MessageDTO message) {
        chatService.saveMessage(message);
    }

    @MessageMapping("/chat/read")
    public void processReadEvent(@Payload MessageDTO message) {
        // 1. DB 업데이트 (해당 사용자가 이 방의 메세지를 읽었다고 기록함)
        // senderId 필드에 읽은 사람의 Id가 담겨져 옴
        chatService.updateMessageReadStatus(message.getRoomId(), message.getSenderId());

        // 읽었다는 신호를 방에 있는 다른 사람들에게 전달
        messagingTemplate.convertAndSend("/sub/chat/room/" + message.getRoomId() + "/read", message );
    }
}