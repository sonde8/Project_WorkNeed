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

    List<UserDTO> findAllWithRememberToken();


    void insertUser(UserDTO user);

    // 특정 부서원들을 미배정(6)으로 변경
    void updateUserDeptToDefault(@Param("deptId") Long deptId);

    // 특정 직급 인원들을 신입(6)으로 변경
    void updateUserRankToDefault(@Param("rankId") Long rankId);

    boolean existsByLoginId(String loginId);

    boolean existsByEmail(String email);


    String findLoginIdByNameAndEmail(@Param("userName") String userName, @Param("email") String email);



    void updateUsersStatus(@Param("userIds") List<Long> userIds,
                           @Param("status") String status);


    void updatePassword(
            @Param("userId") Long userId,
            @Param("userPassword") String userPassword
    );

    //프로필이미지 업데이트
    void updateProfileImage(
            @Param("userId") Long userId,
            @Param("profileImage") String profileImage
    );
}
