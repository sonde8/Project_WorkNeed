package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.entity.User;
import com.Workneed.workneed.Members.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    // 회원가입

    public void register(User user) {

        // 상태 기본값
        user.setUserStatus("ACTIVE");

        // 아이디 중복 체크
        if (userMapper.findByLoginId(user.getUserLoginId()) != null) {
            throw new IllegalStateException("DUPLICATE_LOGIN_ID");
        }

        // 이메일 중복 체크
        if (userMapper.findByEmail(user.getUserEmail()) != null) {
            throw new IllegalStateException("DUPLICATE_EMAIL");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(user.getUserPassword());
        user.setUserPassword(encodedPassword);

        user.setRankId(1L);  //유저 직급 1=신입
        user.setDeptId(5L);  //부서 배정 5=미배정  //신규회원은 신입/미배정

        userMapper.insertUser(user);
    }


    // 로그인
    public User login(String loginId, String rawPassword) {

        User user = userMapper.findByLoginId(loginId);

        if (user == null) {
            return null;
        }

        if (!passwordEncoder.matches(rawPassword, user.getUserPassword())) {
            return null;
        }

        return user;
    }


    // 자동 로그인 (Remember Me)
    public void saveRememberToken(Long userId, String token) {
        userMapper.updateRememberToken(
                userId,
                token,
                LocalDateTime.now().plusDays(365)   // 토큰 저장기간설정
        );
    }

    // 자동 로그인에 쓸 토큰 찾기
    public User findByRememberToken(String token) {
        return userMapper.findByRememberToken(token);
    }

    public void clearRememberToken(Long userId) {
        userMapper.clearRememberToken(userId);
    }

    // 로그인된 사용자 비밀번호 변경

    public void changePassword(
            Long userId,
            String currentPassword,
            String newPassword,
            String confirmPassword
    ) {


        User user = userMapper.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("사용자 정보가 없습니다.");
        }

        // 현재 비밀번호 검증
        if (!passwordEncoder.matches(currentPassword, user.getUserPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }

        // 기존 비밀번호와 동일한지 체크
        if (passwordEncoder.matches(newPassword, user.getUserPassword())) {
            throw new IllegalArgumentException("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }

        // 새 비밀번호 확인
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("새 비밀번호가 일치하지 않습니다.");
        }

        // 비밀번호 정책 검증
        if (!newPassword.matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&]).{8,}$")) {
            throw new IllegalArgumentException(
                    "비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다."
            );
        }

        // 암호화 후 저장
        String encodedPassword = passwordEncoder.encode(newPassword);
        userMapper.updatePassword(userId, encodedPassword);
    }


    // 아이디 찾기 (이름 + 이메일)
    public User findByNameAndEmail(String name, String email) {
        return userMapper.findByNameAndEmail(name, email);
    }


    // User CRUD (관리 / 공용)
    public List<User> getAllUsers() {
        return userMapper.findAll();
    }

    public User getUser(Long userId) {
        return userMapper.findById(userId);
    }

    public void createUser(User user) {
        userMapper.insertUser(user);
    }

    public void updateUser(User user) {
        userMapper.updateUser(user);
    }

    public void deleteUser(Long userId) {
        userMapper.deleteUser(userId);
    }
}
