package com.Workneed.workneed.Chat.mapper;

import com.Workneed.workneed.Chat.dto.MessageDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MessageMapper {

    // 1. 새 메세지 저장 (웹소켓 통신 직후 실행)
    // messageId는 자동 생성되므로 DTO에 다시 담겨 반환됨
    void insertMessage(MessageDTO message);

    // 2. 특정 채팅방의 과거 메세지 기록 조회
    // room_id로 Message, User 테이블을 JOIN 하여 senderName을 채워야 됨
    List<MessageDTO> findMessagesByRoomId(Long roomId);

    // 3. 마지막으로 전송된 메세지 Id 조회
    Long findLastMessageIdByRoomId(Long roomId);

    // 4. 메세지 읽음 처리를 위한 로직
    void insertReadReceipt(@Param("roomId") Long roomId, @Param("userId") Long userId);
    void insertSingleReadReceipt(@Param("messageId") Long messageId, @Param("userId") Long userId);

    // 5. 특정 메세지의 현재 안 읽은 인원수 조회
    // XML의 #{roomId}와 #{messageId}에 값을 바인딩합니다.
    int getUnreadCount(@Param("roomId") Long roomId, @Param("messageId") Long messageId);
}
