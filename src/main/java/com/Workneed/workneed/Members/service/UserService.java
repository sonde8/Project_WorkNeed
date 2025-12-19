package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.entity.User;
import com.Workneed.workneed.Members.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    public void register(User user) {

        // 상태 기본값
        user.setUserStatus("ACTIVE");

        // 비밀번호 암호화
        String encodedPw = passwordEncoder.encode(user.getUserPassword());
        user.setUserPassword(encodedPw);

        //아이디,이메일 중복체크
        if (userMapper.findByLoginId(user.getUserLoginId()) != null) {
            throw new IllegalStateException("DUPLICATE_LOGIN_ID");
        }

        if (userMapper.findByEmail(user.getUserEmail()) != null) {
            throw new IllegalStateException("DUPLICATE_EMAIL");
        }
            userMapper.insertUser(user);
    }

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

    //로그인된 사용자 비밀번호변경
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

        //현재 비밀번호 검증
        if (!passwordEncoder.matches(currentPassword, user.getUserPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }

        //기존 비밀번호와 동일한지 체크
        if (passwordEncoder.matches(newPassword, user.getUserPassword())) {
            throw new IllegalArgumentException("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }

        //새 비밀번호 확인
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("새 비밀번호가 일치하지 않습니다.");
        }

        //비밀번호 정책
        if (!newPassword.matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&]).{8,}$")) {
            throw new IllegalArgumentException(
                    "비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다."
            );
        }

        //암호화 후 저장
        String encodedPassword = passwordEncoder.encode(newPassword);
        userMapper.updatePassword(userId, encodedPassword);
    }

    //아이디찾기이메일
    public User findByNameAndEmail(String name, String email) {
        return userMapper.findByNameAndEmail(name, email);
    }
}
