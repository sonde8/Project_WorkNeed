package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;


import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface UserMapper {

    List<User> findAll();

    User findByLoginId(String loginId); //아이디중복체크

    User findByEmail(String email); //이메일중복체크

    User findById(Long userId);

    User findByRememberToken(String token); // 자동로그인 토큰저장

    void insertUser(User user);

    void updateUser(User user);

    void deleteUser(Long userId);

    void updatePassword(
            @Param("userId") Long userId,
            @Param("userPassword") String userPassword
    );

    void updateRememberToken( //토큰 정보 업데이트
                              @Param("userId") Long userId,
                              @Param("token") String token,
                              @Param("expiredAt") LocalDateTime expiredAt
    );

    User findByNameAndEmail(
            @Param("name") String name,
            @Param("email") String email
    );


    void clearRememberToken(Long userId); //토큰정보삭제-로그아웃시 같이됨


}
