package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.UserMapper;
import com.Workneed.workneed.config.CustomUserDetails;
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

    // 생성자 주입 + @Lazy로 시큐리티와의 순환 참조 문제 해결
    public UserService(UserMapper userMapper, @Lazy PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * [Spring Security 전용] 로그인 시 아이디로 사용자 정보를 가져오는 메서드
     * 직접 만든 login() 대신 시큐리티 내부에서 이 메서드를 사용해 인증을 처리합니다.
     */
    @Override
    public UserDetails loadUserByUsername(String loginId) throws UsernameNotFoundException {
        UserDTO user = userMapper.findByLoginId(loginId);

        if (user == null) {
            log.error("사용자를 찾을 수 없음: {}", loginId);
            throw new UsernameNotFoundException("존재하지 않는 사용자 아이디입니다: " + loginId);
        }

        // 일반 로그인 시 OAuth2 속성(Map)은 null로 전달
        return new CustomUserDetails(user, null);
    }

    /**
     * 회원 가입 (상태, 직급, 부서 고정값 적용)
     */
    public void register(UserDTO user) {
        if (user.getUserPassword() != null) {
            // 비밀번호 암호화
            user.setUserPassword(passwordEncoder.encode(user.getUserPassword()));
        }

        // DB 제약 조건을 맞추기 위한 고정값 세팅
        user.setUserStatus("ACTIVE"); // 상태 고정
        user.setRankId(1L);           // 직급 고정 (사원)
        user.setDeptId(5L);           // 부서 고정 (미배정)

        userMapper.insertUser(user);
        log.info("새로운 사용자 등록 완료: {}", user.getUserLoginId());
    }

    /**
     * 비밀번호 변경
     */
    public void changePassword(Long userId, String currentPassword, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("새 비밀번호가 일치하지 않습니다.");
        }

        UserDTO user = userMapper.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }

        if (!passwordEncoder.matches(currentPassword, user.getUserPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        String encryptedPassword = passwordEncoder.encode(newPassword);
        userMapper.updatePassword(userId, encryptedPassword);
    }

    /**
     * 자동 로그인 관련 로직
     */
    public void saveRememberToken(Long userId, String token) {
        LocalDateTime expiredAt = LocalDateTime.now().plusYears(1);
        userMapper.updateRememberToken(userId, token, expiredAt);
    }

    public void clearRememberToken(Long userId) {
        userMapper.clearRememberToken(userId);
    }

    public UserDTO findByRememberToken(String token) {
        return userMapper.findByRememberToken(token);
    }

    /**
     * 조회 및 유효성 검사 로직
     */
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

    public void updateRememberToken(Long userId, String token, LocalDateTime expiredAt) {
        userMapper.updateRememberToken(userId, token, expiredAt);
    }

    public void logout(Long userId) {
        userMapper.clearRememberToken(userId);
    }
}