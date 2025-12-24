package com.Workneed.workneed.Chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long userId;          // 세션 및 FK 참조용 (필수)
    private String username;      // 채팅방 목록 및 메시지 발신자 이름 표시 (필수)
    private String userProfileImage; // 채팅창 프로필 사진 표시용 (권장)
    private String userLoginId;   // 계정 식별용
    private String deptname;      // 부서 이름
    private String rankname;      // 직급
}
