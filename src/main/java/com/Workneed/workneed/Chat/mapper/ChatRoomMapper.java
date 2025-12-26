package com.Workneed.workneed.Chat.mapper;

import com.Workneed.workneed.Chat.dto.ChatRoomDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatRoomMapper {

    // 1. 채팅방 생성
    // DTO를 받아 DB에 저장하고 AUTO_INCREMENT 된 room_id를 DTO에 다시 담아 반환
    void createChatRoom(ChatRoomDTO chatRoomDTO);

    // 2. 특정 사용자가 참여안 모든 채팅방 조회
    // ChatRoomDTO 목록을 반환하여, 쿼리에서 lastMessageConetent, userCount 등의 파생필드를 채움
    List<ChatRoomDTO> findAllRoomsByUserId(Long userId);
    // 나를 제외한 참여자 이름 목록 조회
    List<String> getParticipantNamesExceptMe(@Param("roomId") Long roomId, @Param("userId") Long userId);

    // 3. room_id로 특정 채팅방 정보 조회
    ChatRoomDTO findRoomById(Long roomId);

    // 4. 채팅방 참여자 테이블에 사용자 추가
    void addParticipant(Long roomId, Long userId);

    // 5. 채팅방 나가기
    void leaveRoom(@Param("roomId") Long roomId, @Param("userId") Long userId);

}
