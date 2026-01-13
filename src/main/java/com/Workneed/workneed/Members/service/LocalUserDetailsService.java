package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.auth.principal.CustomUserDetails;
import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import com.Workneed.workneed.Members.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;


import java.util.List;
import java.util.stream.Collectors;


//아이디(또는 이메일)가 누구인지 찾아서
//Spring Security가 이해할 수 있는 UserDetails로만 바꿔줌
@Service
@RequiredArgsConstructor
public class LocalUserDetailsService implements UserDetailsService {

    private final UserMapper userMapper;
    private final AdminUserMapper adminUserMapper;

    //Spring Security가 ‘아이디 + 비밀번호 로그인을 처리할 때
    //DB에서 사용자를 찾아 UserDetails로 변환
    // 일반 유저는 로그인id로 접근 ||  관리자는 이메일로 접근
    @Override
    public UserDetails loadUserByUsername(String loginInput) throws UsernameNotFoundException {

        // 2 일반 유저 찾아보기
        UserDTO user = userMapper.findByLoginId(loginInput);
        if (user != null) {

            if (!"ACTIVE".equals(user.getUserStatus())) {


                String reason = "pending";

                if (user.getUserCreatedAt() != null) {
                    long days = java.time.temporal.ChronoUnit.DAYS.between(user.getUserCreatedAt(), java.time.LocalDate.now());
                    if (days >= 30) {
                        reason = "inactive";
                    }
                }
                throw new DisabledException(reason);
            }
            // ROLE_USER로 반환
            return new CustomUserDetails(user);
        }

        AdminUserDTO admin = adminUserMapper.findByAdminEmail(loginInput);
        if (admin != null) {

            //  ACTIVE 아니면 무조건 차단
            if (!"ACTIVE".equals(admin.getAdminStatus())) {
                throw new DisabledException("suspended");
            }

            // permission(권한) 코드 조회
            List<String> permissions = adminUserMapper.findPermissionsByRoleId(admin.getRoleId());

            // permission → GrantedAuthority 객체로 변환
            // GrantedAuthority 인터페이스로 구현한 객체만 사용
            // 리스트를 하나씩 꺼내서
            List<GrantedAuthority> authorities = permissions.stream()
                    // 문자열 권한을 객체로 변환
                    .map(SimpleGrantedAuthority::new)
                    // 다시 리스트로 모음
                    .collect(Collectors.toList());

            // 고유 권한을 가진 관리자 반환
            return new CustomUserDetails(admin, authorities);
        }
        throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + loginInput);
    }
}

