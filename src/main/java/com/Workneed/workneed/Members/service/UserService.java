package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import com.Workneed.workneed.Members.mapper.UserMapper;
import com.Workneed.workneed.config.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class UserService implements UserDetailsService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AdminUserMapper adminUserMapper;
    private final HttpServletRequest request;

    public UserService(UserMapper userMapper,
                       AdminUserMapper adminUserMapper,
                       @Lazy PasswordEncoder passwordEncoder,
                       HttpServletRequest request) {
        this.userMapper = userMapper;
        this.adminUserMapper = adminUserMapper;
        this.passwordEncoder = passwordEncoder;
        this.request = request;
    }

    @Override
    public UserDetails loadUserByUsername(String loginId) throws UsernameNotFoundException {
        // HTML의 hidden 필드에서 userType("ADMIN" 또는 "USER")을 가져옴
        String userType = request.getParameter("userType");
        log.info("로그인 시도 - 타입: {}, ID: {}", userType, loginId);

        // 1. 관리자 테이블 조회 (userType이 ADMIN인 경우)
        if ("ADMIN".equals(userType)) {
            AdminUserDTO admin = adminUserMapper.findByAdminEmail(loginId);
            if (admin == null) {
                log.error("관리자 계정 없음: {}", loginId);
                throw new UsernameNotFoundException("등록되지 않은 관리자 계정입니다.");
            }
            return new CustomUserDetails(admin, "ROLE_ADMIN");
        }

        // 2. 일반 유저 테이블 조회 (기본값)
        UserDTO user = userMapper.findByLoginId(loginId);
        if (user == null) {
            log.error("일반 사용자 계정 없음: {}", loginId);
            throw new UsernameNotFoundException("존재하지 않는 사용자입니다: " + loginId);
        }
        return new CustomUserDetails(user, "ROLE_USER");
    }

    // --- 기존 유지 메서드들 (수정 없음) ---

    public void register(UserDTO user) {
        if (user.getUserPassword() != null) {
            user.setUserPassword(passwordEncoder.encode(user.getUserPassword()));
        }
        user.setUserStatus("ACTIVE");
        user.setRankId(1L);
        user.setDeptId(5L);
        userMapper.insertUser(user);
    }

    public void changePassword(Long userId, String currentPassword, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) throw new IllegalArgumentException("비밀번호 불일치");
        UserDTO user = userMapper.findById(userId);
        if (!passwordEncoder.matches(currentPassword, user.getUserPassword()))
            throw new IllegalArgumentException("현재 비번 틀림");
        userMapper.updatePassword(userId, passwordEncoder.encode(newPassword));
    }

    public void saveRememberToken(Long userId, String token) {
        userMapper.updateRememberToken(userId, token, LocalDateTime.now().plusYears(1));
    }

    public void clearRememberToken(Long userId) {
        userMapper.clearRememberToken(userId);
    }

    public UserDTO findByRememberToken(String token) {
        return userMapper.findByRememberToken(token);
    }

    public UserDTO findByLoginId(String loginId) {
        return userMapper.findByLoginId(loginId);
    }

    public UserDTO findByEmail(String email) {
        return userMapper.findByEmail(email);
    }

    public UserDTO findById(Long userId) {
        return userMapper.findById(userId);
    }

    public List<UserDTO> getAllUsers() {
        return userMapper.findAll();
    }
}