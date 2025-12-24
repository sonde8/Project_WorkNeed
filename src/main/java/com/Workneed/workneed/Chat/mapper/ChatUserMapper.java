package com.Workneed.workneed.Chat.mapper;

import org.apache.ibatis.annotations.Mapper;
import com.Workneed.workneed.Chat.dto.UserDTO;

import java.util.List;

@Mapper
public interface ChatUserMapper {

    // 1. 이름으로 사용자 ID 조회
    Long findUserByUsername(String username);

    // 2. ID로 사용자 정보 조회
    UserDTO findUserById(Long userId);

    // 3. 채팅방 초대를 위한 전체 사용자 조회
    List<UserDTO> findAllUsersWithDept();
}
