package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.dto.UserDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;


import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface UserMapper {

    List<UserDTO> findAll();

    UserDTO findByLoginId(String loginId); //아이디중복체크

    UserDTO findByEmail(String email); //이메일중복체크

    UserDTO findById(Long userId);

    UserDTO findByRememberToken(String token); // 자동로그인 토큰저장

    void insertUser(UserDTO user);

    void updateUser(UserDTO user);

    void deleteUser(Long userId);

    void updatePassword(
            @Param("userId") Long userId,
            @Param("userPassword") String userPassword
    );

    void updateUsersStatus(@Param("userIds") List<Long> userIds,
                           @Param("status") String status);

    void updateRememberToken( //토큰 정보 업데이트
                              @Param("userId") Long userId,
                              @Param("token") String token,
                              @Param("expiredAt") LocalDateTime expiredAt
    );


    //프로필이미지 업데이트
    void updateProfileImage(
            @Param("userId") Long userId,
            @Param("imageUrl") String imageUrl
    );

    UserDTO findByNameAndEmail(

            @Param("name") String name,
            @Param("email") String email
    );

    List<UserDTO> findAllWithDetails();

    void clearRememberToken(@Param("userId") Long userId); //토큰정보삭제-로그아웃시 같이됨


}
