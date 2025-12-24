package com.Workneed.workneed.Chat.service;

import com.Workneed.workneed.Chat.dto.UserDTO;
import com.Workneed.workneed.Chat.dto.ChatRoomDTO;
import com.Workneed.workneed.Chat.dto.MessageDTO;
import com.Workneed.workneed.Chat.mapper.ChatRoomMapper;
import com.Workneed.workneed.Chat.mapper.ChatUserMapper;
import com.Workneed.workneed.Chat.mapper.FileLogMapper;
import com.Workneed.workneed.Chat.mapper.MessageMapper;
import org.apache.catalina.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private ChatRoomMapper chatRoomMapper;

    @Autowired
    private MessageMapper messageMapper;

    @Autowired
    private ChatUserMapper chatUserMapper;

    @Autowired
    private FileLogMapper fileLogMapper;

    // 1. 채팅방 관리 로직

    // 1-1. 채팅방 생성 및 인원 초대
    // 방을 생성하고 생성자 및 초대받은 유저들을 참여자로 등록함
    @Transactional
    public ChatRoomDTO createChatRoom(String roomName, Long creatorId, List<Long> inviteUserIds, String roomType) {
        // 초대 인원 수에 따라 방 타입을 자동으로 결정
        String finalRoomType = roomType;
        if (finalRoomType == null) {
            finalRoomType = (inviteUserIds != null && inviteUserIds.size() == 1) ? "DIRECT" : "GROUP";
        }

        // 1-1-1. 방 제목이 공백이면 null로 저장하여 자동 생성 대상임을 알려줌
        String finalRoomName = (roomName == null || roomName.trim().isEmpty()) ? null : roomName;

        ChatRoomDTO roomDTO = ChatRoomDTO.builder()
                .roomName(finalRoomName)
                .roomType(finalRoomType)
                .creatorId(creatorId)
                .build();

        // 1-1-2. 방 생성
        chatRoomMapper.createChatRoom(roomDTO);
        // 1-1-3. 생성자 본인 참여 (mapper 호출)
        chatRoomMapper.addParticipant(roomDTO.getRoomId(), creatorId);
        // 1-1-4. 초대 받은 유저들을 모두 참여자로 추가 (mapper 반복 호출)
        if (inviteUserIds != null && !inviteUserIds.isEmpty()) {
            for (Long targetUserId : inviteUserIds) {
                // 본인이 중복으로 포함되지 않도록 체크
                if (!targetUserId.equals(creatorId)) {
                    chatRoomMapper.addParticipant(roomDTO.getRoomId(), targetUserId);
                }
            }
        }
        return roomDTO;
    }

    // 1-2. 사용자가 참여 중인 채팅방 목록 조회 (방 제목 설정하지 않은 방 포함)
    // 사용자가 속한 모든 방 가져옴, 이름을 정하지 않은 방은 이름을 자동으로 생성해줌
    public List<ChatRoomDTO> getUserRooms(Long userId) {
        List<ChatRoomDTO> rooms = chatRoomMapper.findAllRoomsByUserId(userId);

        for (ChatRoomDTO room : rooms) {
            if (room.getRoomName() == null || room.getRoomName().trim().isEmpty()) {
                // [변경] 긴 로직 대신 아래 공통 메서드를 호출합니다.
                room.setRoomName(generateAutoRoomName(room.getRoomId(), userId));
            }
        }
        return rooms;
    }

    // 1-3. 특정 채팅방 상세 정보 조회
    // 방 ID로 상세 정보 조회, 이름이 없는 경우 자동 생성 로직
    public ChatRoomDTO getRoomDetail(Long roomId, Long userId) {
        ChatRoomDTO room = chatRoomMapper.findRoomById(roomId);
        if (room != null && (room.getRoomName() == null || room.getRoomName().trim().isEmpty())) {
            // 자동 방 생성 로직 적용
            room.setRoomName(generateAutoRoomName(roomId, userId));
        }
        return room;
    }

    // 1-4 [공통 로직] 자동 방 제목 생성 로직
    // 방 제목을 설정하지 않았을 때 참여자의 이름을 조합하여 채팅방 제목을 설정
    private String generateAutoRoomName(Long roomId, Long userId) {
        List<String> names = chatRoomMapper.getParticipantNamesExceptMe(roomId, userId);

        if (names == null || names.isEmpty()) return "대화 상대 없음";

        String autoName = names.stream().limit(3).collect(Collectors.joining(", "));
        if (names.size() > 3) autoName += "...";

        return autoName;
    }

    // 1-5 채팅방 나가기 로직
    @Transactional
    public void leaveChatRoom(Long roomId, Long userId) {
        // 1-5-1. DB 업데이트: RoomParticipant 테이블의 left_at 컬럼을 현재 시간으로 업데이트
        // 이 작업이 완료되면 findAllRoomsByUserId 쿼리에서 해당 방이 제외됨
        chatRoomMapper.leaveRoom(roomId, userId);

        // 1-5-2. 퇴장 시스템 메세지 생성 및 전송
        // 기존에 구현한 sendSystemMessage 호출
        // 내부 로직에 의해 GROUP 방일 때만 메세지가 DB에 저장되고 발송
        MessageDTO leaveMsg = sendSystemMessage(roomId, userId, "LEAVE");
    }


    // 2. 메세지 및 읽음 처리

    // 2-1. 일반 메세지 전송 및 저장
    // 메세지를 DB에 저장하고, 보낸 사람은 즉시 읽음 처리, 화면용 시간 포맷 설정
    @Transactional
    public MessageDTO saveMessage(MessageDTO messageDTO) {
        // 메세지타입의 공백 강제 제거
        if(messageDTO.getMessageType() != null) {
            messageDTO.setMessageType(messageDTO.getMessageType().trim());
        }

        // DB 저장
        if (messageDTO.getCreatedAt() == null) {
            messageDTO.setCreatedAt(LocalDateTime.now());
        }

        messageMapper.insertMessage(messageDTO);

        // 로그를 찍어 파일로그 아이디가 넘어오는지 확인
        System.out.println("전달된 fileLogId: " + messageDTO.getFileLogId());

        // 파일이 첨부된 메세지라면 FileLog 테이블에 messageId 업데이트
        if (messageDTO.getFileLogId() != null) {
            fileLogMapper.updateMessageId(messageDTO.getFileLogId(), messageDTO.getMessageId());
        }

        // 본인이 보낸 메세지는 본인이 읽은 것으로 간주되어 테이블에 기록
        messageMapper.insertSingleReadReceipt(messageDTO.getMessageId(), messageDTO.getSenderId());

        // 발신자 정보 보완
        UserDTO user = chatUserMapper.findUserById(messageDTO.getSenderId());
        if (user != null) {
            messageDTO.setSenderName(user.getUsername());
        }

        // 시간 포맷팅
        if (messageDTO.getCreatedAt() != null) {
            messageDTO.setDisplayTime(messageDTO.getCreatedAt().format(DateTimeFormatter.ofPattern("a h:mm")));
        }

        return messageDTO;
    }

    // 2-2. 시스템 메세지
    // 채팅방 입장 퇴장 알림 (단체 채팅에만 활성화)
    @Transactional
    public MessageDTO sendSystemMessage(Long roomId, Long userId, String type) {
        // 현재 방 정보를 조회하여 타입을 확인
        ChatRoomDTO room = chatRoomMapper.findRoomById(roomId);

        // 방이 존재하고 방 타입이 GROUP일 때만 시스템 메세지를 생성
        // 1:1인 경우에는 null 반환 or 로직 종료
        if (room !=null && "GROUP".equals(room.getRoomType())) {
            // 2-2-1. 유저 정보 조회
            UserDTO user = chatUserMapper.findUserById(userId);
            String username = (user != null) ? user.getUsername() : "알 수 없는 사용자";

            // 2-2-2. 메세지 내용 생성
            String content = "ENTER".equals(type) ? username + "님이 입장하셨습니다." : username + "님이 퇴장하셨습니다.";

            // 2-2-3. 빌더로 DTO 생성
            MessageDTO systemMsg = MessageDTO.builder()
                    .roomId(roomId)
                    .senderId(userId) // 또는 시스템 계정 ID
                    .content(content)
                    .messageType(type) // "ENTER" 또는 "LEAVE"
                    .build();

            // 2-2-4. 기존에 만들어둔 saveMessage를 호출하여 DB 저장 및 시간 세팅까지 한 번에 처리
            return saveMessage(systemMsg);
        }
        return null;    // 1:1 대화라면 메세지를 생성하지 않음
    }

    // 2-3. 채팅 내역 조회 및 전체 읽음 처리
    // 특정 방의 메세지들을 불러오고 입장하는 순간 방의 모든 메세지를 읽음 처리
    @Transactional
    public List<MessageDTO> getChatHistory(Long roomId, Long userId) {
        // 사용자가 방에 들어왔으므로 이 방의 메세지들을 모두 읽음으로 테이블에 기록
        messageMapper.insertReadReceipt(roomId, userId);

        // 메세지 내역 조회 (MessageMapper.xml 에서 만든 서브쿼리가 unread_count를 계산)
        List<MessageDTO> history = messageMapper.findMessagesByRoomId(roomId);

        // 시간 변환 처리
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("a h:mm");

        history.forEach(msg -> {
            if(msg.getCreatedAt() != null) {
                // DB에서 가져온 LocalDateTime을 UTC로 인식한 뒤, Asia/Seoul 시간으로 변환합니다.
                ZonedDateTime seoulTime = msg.getCreatedAt()
                        .atZone(ZoneId.of("UTC"))
                        .withZoneSameInstant(ZoneId.of("Asia/Seoul"));

                // 변환된 시간을 DTO의 displayTime 필드에 세팅합니다.
                msg.setDisplayTime(seoulTime.format(formatter));
            }
        });

        return history;
    }

    // 2-4. 실시간 읽음 상태
    // 메세지 목록을 불러오지 않고 단순히 읽음 상태만 최신화 할 때 사용
    @Transactional
    public void updateMessageReadStatus(Long roomId, Long userId) {
        // 이미 Mapper에 만들어두신 메서드를 호출합니다.
        messageMapper.insertReadReceipt(roomId, userId);
    }

    // 2-5. 단체 메세지 초대 시스템 메세지
    @Transactional
    public void sendInviteMessage(Long roomId, Long creatorId, List<Long> inviteUserIds) {
        // 생성자 이름 조회
        UserDTO creator = chatUserMapper.findUserById(creatorId);
        String creatorName = (creator != null) ? creator.getUsername() : "알 수 없는 사용자";

        // 초대받은 유저들의 이름 리스트 조회
        List<String> invitedNames = inviteUserIds.stream()
                .map(id -> {
                    UserDTO user = chatUserMapper.findUserById(id);
                    return (user != null) ? user.getUsername() : "알 수 없는 사용자";
                }).collect(Collectors.toList());

        // 메세지 내용 조합 (예 : A님이 B님, C님을 초대하였습니다.)
        String invitedNameStr = String.join(", ", invitedNames);
        String content = creatorName + "님이 " + invitedNameStr + "님을 초대하였습니다.";

        // 시스템 메세지로 저장 (ENTER 타입 활용)
        MessageDTO inviteMsg = MessageDTO.builder()
                .roomId(roomId)
                .senderId(creatorId)
                .content(content)
                .messageType("ENTER")
                .build();

        saveMessage(inviteMsg);
    }

    // 3. 사용자 및 부가정보
    // 모달에서 사용하기 위해 부서, 직급 정보가 포함된 전체 유저 리스트를 가져옴
    public List<UserDTO> getAllUsersWithDept() {
        // 수정된 ChatUserMapper의 쿼리 실행
        return chatUserMapper.findAllUsersWithDept();
    }
}
