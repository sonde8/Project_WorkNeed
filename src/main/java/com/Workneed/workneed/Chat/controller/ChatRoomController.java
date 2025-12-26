package com.Workneed.workneed.Chat.controller;

import com.Workneed.workneed.Chat.dto.ChatRoomDTO;
import com.Workneed.workneed.Chat.dto.MessageDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Chat.service.ChatService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/chat")
public class ChatRoomController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    /*
     * 1. 채팅 메인 진입 (선택된 방 없음 - 목록만 표시)
    */
    @GetMapping("/rooms")
    public String roomList(Model model, HttpSession session) {
        // 세션에서 실제 로그인한 유저 ID 연동
        UserDTO user = (UserDTO) session.getAttribute("user");

        // 로그인이 안 된 상태라면 로그인 페이지로 리다이렉트
        if (user == null) {
            return "redirect:/login";
        }

        Long currentUserId = user.getUserId();

        // 왼쪽 사이드바용 전체 목록 조회
        List<ChatRoomDTO> rooms = chatService.getUserRooms(currentUserId);

        model.addAttribute("pageTitle", "워크니드 채팅");
        model.addAttribute("rooms", rooms);
        model.addAttribute("room", null); // 오른쪽 영역 비우기

        return "Chat/chatroom";
    }

    /*
     * 2. 특정 채팅방 선택 (목록 유지 + 대화창 활성화)
    */
    @GetMapping("/room/{roomId}")
    public String joinRoom(@PathVariable Long roomId, @RequestParam(value="userId", required=false) Long tempId, // URL 파라미터 추가
                           Model model, HttpSession session) {

        // 테스트를 위해 하드코딩 했던 1L 지우고 만든 세션에서 정보를 가져오는 코드
        UserDTO user = (UserDTO) session.getAttribute("user");
        System.out.println("실제 세션에서 꺼낸 ID: " + user.getUserId());

        // null 체크
        if (user == null) {
            return "redirect:/login";
        }

        Long currentUserId = user.getUserId();

        // 왼쪽 목록 유지를 위해 전체 리스트 다시 조회
        List<ChatRoomDTO> rooms = chatService.getUserRooms(currentUserId);

        // 선택된 방 정보 및 과거 대화 내역 조회
        ChatRoomDTO room = chatService.getRoomDetail(roomId, currentUserId);
        List<MessageDTO> history = chatService.getChatHistory(roomId, currentUserId);

        // --- 입장 알림 전송 (무한 루프 방지) ---

        /*
        String sessionKey = "entered_room_" + roomId;
        if (room != null && "GROUP".equals(room.getRoomType())) {
            if (session.getAttribute(sessionKey) == null) {
                MessageDTO enterMsg = chatService.sendSystemMessage(roomId, currentUserId, "ENTER");

                // 서비스에서 DIRECT일 때 null을 반환하게 수정했다면 null 체크가 필요합니다.
                if (enterMsg != null) {
                    messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, enterMsg);
                }
                session.setAttribute(sessionKey, true);
            }
        }
        */

        model.addAttribute("rooms", rooms);
        model.addAttribute("room", room);
        model.addAttribute("history", history);
        model.addAttribute("pageTitle", (room != null) ? room.getRoomName() : "채팅방");
        model.addAttribute("currentUserId", currentUserId);

        return "Chat/chatroom";
    }

    /*
     * 3. 채팅방 나가기 (퇴장 알림 처리)
    */
    @PostMapping("/room/{roomId}/leave")
    public String leaveRoom(@PathVariable("roomId") Long roomId, HttpSession session) {
        UserDTO user = (UserDTO) session.getAttribute("user");
        if (user == null) return "redirect:/login";

        Long currentUserId = user.getUserId();

        // 퇴장 메시지 브로드캐스팅
        MessageDTO leaveMsg = chatService.sendSystemMessage(roomId, currentUserId, "LEAVE");
        messagingTemplate.convertAndSend("/sub/chat/room/" + roomId, leaveMsg);

        // 다시 입장 시 알림을 위해 세션 기록 삭제
        session.removeAttribute("entered_room_" + roomId);

        return "redirect:/chat/rooms";
    }

    /*
     * 4. 채팅방 생성
     * 사용자가 입력한 방 이름을 받고, 세션에서 내 정보를 꺼내 서비스로 넘김
    */
    @PostMapping("/room")
    public String createRoom(@RequestParam(value = "roomName", required = false) String roomName,
                             @RequestParam(value = "inviteUserIds") List<Long> inviteUserIds,
                             HttpSession session) {
        // 세션 유저 정보 가져오기
        UserDTO user = (UserDTO) session.getAttribute("user");
        // 세션이 비어있다면 로그인 페이지로
        if (user == null) return "redirect:/login";

        Long creatorId = user.getUserId();

        // 방 타입 판별
        // inviteUserIds에 나를 제외한 인원수가 들어오기 때문에 이를 기준으로 판단
        String roomType = (inviteUserIds.size() ==1) ? "DIRECT" : "GROUP";

        // 서비스 호출 (방 생성 + 참여자 추가)
        ChatRoomDTO newRoom = chatService.createChatRoom(roomName, creatorId, inviteUserIds, roomType);

        // 그룹 채팅방일 때만 초대 시스템 메세지 발송
        if ("GROUP".equals(roomType)) {
            chatService.sendInviteMessage(newRoom.getRoomId(), creatorId, inviteUserIds);
        }

        // 방 목록으로 가기보다 방금 만든 방으로 바로 입장 시켜주는 코드
        return "redirect:/chat/room/" + newRoom.getRoomId();
    }

    /*
    * 5. 모달창에서 직원 불러오기
    */
    @GetMapping("/users")
    @ResponseBody
    public List<UserDTO> getAllUsers() {
        // ChatService를 통해 DB의 모든 유저(부서 직급 포함) 가져옴
        return chatService.getAllUsersWithDept();
    }
}