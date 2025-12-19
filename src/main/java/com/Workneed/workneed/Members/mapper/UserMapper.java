package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;


import java.util.List;

@Mapper
public interface UserMapper {

    List<User> findAll();

    User findByLoginId(String loginId); //아이디중복체크

    User findByEmail(String email); //이메일중복체크

    User findById(Long userId);

    void insertUser(User user);
    
    void updateUser(User user);

    void deleteUser(Long userId);

    void updatePassword(
            @Param("userId") Long userId,
            @Param("userPassword") String userPassword
    );

    User findByNameAndEmail(
            @Param("name") String name,
            @Param("email") String email
    );


}
