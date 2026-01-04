package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.auth.principal.CustomUserDetails;
import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import com.Workneed.workneed.Members.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LocalUserDetailsService implements UserDetailsService {

    private final UserMapper userMapper;
    private final AdminUserMapper adminUserMapper;
    //Spring Security가 ‘아이디 + 비밀번호 로그인’을 처리할 때
    //DB에서 사용자를 찾아 UserDetails로 변환
    // 일반 유저는 로그인id로 접근 ||  관리자는 이메일로 접근
    @Override
    public UserDetails loadUserByUsername(String loginInput) throws UsernameNotFoundException {

        AdminUserDTO admin = adminUserMapper.findByAdminEmail(loginInput);
        if (admin != null) {
            return new CustomUserDetails(admin);
        }

        // 2  일반 유저 찾아보기 (로그인ID 기준)
        UserDTO user = userMapper.findByLoginId(loginInput);
        if (user != null) {
            return new CustomUserDetails(user);
        }

        throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + loginInput);
    }
}