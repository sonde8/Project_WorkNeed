package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.SocialAccountDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.SocialAccountMapper;
import com.Workneed.workneed.Members.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class UserService {

    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder; // 분리된 PasswordConfig의 빈 주입
    private final SocialAccountMapper socialAccountMapper;
    private final MailService mailService;

    private static final Long DEFAULT_DEPT_ID = 6L; // 부서 미지정
    private static final Long DEFAULT_RANK_ID = 6L; // 직급 신입


    @Transactional
    public void updateProfileImage(Long userId, String profileImage) {
        userMapper.updateProfileImage(userId, profileImage);
        log.info("유저 ID {} 의 프로필 사진이 업데이트되었습니다.", userId);
    }


    public void register(UserDTO user) {
        if (user.getUserPassword() != null) {
            user.setUserPassword(passwordEncoder.encode(user.getUserPassword()));
        }
        user.setUserStatus("INACTIVE");
        user.setDeptId(DEFAULT_DEPT_ID);
        user.setRankId(DEFAULT_RANK_ID);

        // 1.DB에 유저 정보를 저장
        userMapper.insertUser(user);


        log.info("신규 유저 가입 완료 및 환영 메일 발송: {}", user.getUserLoginId());
    }

    //비밀번호 재설정 암호하
    public void changePassword(Long userId, String currentPassword, String newPassword, String confirmPassword) {
        // 1 일치 여부 확인
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("새 비밀번호가 서로 일치하지 않습니다.");
        }

        // 2 8자리 이상 영문/숫자/특수문자 조합 검사 (정규식)
        String pwPattern = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$!%*#?&])[A-Za-z\\d$!%*#?&]{8,}$";
        if (!newPassword.matches(pwPattern)) {
            throw new IllegalArgumentException("비밀번호는 8자 이상의 영문, 숫자, 특수문자(@ 제외) 조합이어야 합니다.");
        }

        // 3 현재 비밀번호 확인 및 변경
        UserDTO user = userMapper.findById(userId);
        if (!passwordEncoder.matches(currentPassword, user.getUserPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 틀립니다.");
        }

        // 4 이전 비밀번호와 동일한지 체크
        if (passwordEncoder.matches(newPassword, user.getUserPassword())) {
            throw new IllegalArgumentException("기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.");
        }

        // 5 검사 통과시 업뎃
        userMapper.updatePassword(userId, passwordEncoder.encode(newPassword));
    }

    public UserDTO findById(Long userId) {
        return userMapper.findById(userId);
    }

    public List<UserDTO> getAllUsers() {
        return userMapper.findAll();
    }

    // 아이디 중복 확인
    public boolean isLoginIdExists(String loginId) {
        return userMapper.existsByLoginId(loginId);
    }

    // 이메일 중복 확인
    public boolean isEmailExists(String email) {
        return userMapper.existsByEmail(email);
    }

    @Transactional
    public void linkSocialAccount(Long userId, String provider, String providerId, String email, String pic) {
        if (socialAccountMapper.findByUserAndProvider(userId, provider) != null) {
            log.info("이미 연동된 계정입니다. (UserID: {})", userId);
        } else {
            SocialAccountDTO dto = new SocialAccountDTO();
            dto.setUserId(userId);
            dto.setSocialProvider(provider);
            dto.setSocialProviderUserId(providerId);
            dto.setSocialEmail(email);
            socialAccountMapper.insertSocialAccount(dto);
            log.info("소셜 연동 테이블 저장 완료");
        }

        if (pic != null) {
            userMapper.updateProfileImage(userId, pic);
            log.info("유저 프로필 이미지 업데이트 완료: {}", pic);
        }
    }

    // 이름과 이메일로 아이디 찾기
    public String findId(String userName, String userEmail) {

        return userMapper.findLoginIdByNameAndEmail(userName, userEmail);
    }

    @Transactional
    public String createTempPassword(String loginId, String email) {
        UserDTO user = userMapper.findByLoginId(loginId);

        log.info("비밀번호 찾기 시도 - 입력ID: {}, 입력Email: {}", loginId, email);

        if (user == null || user.getUserEmail() == null) {
            return null;
        }

        if (!email.equals(user.getUserEmail())) {
            return null;
        }

        String tempPw = UUID.randomUUID().toString().substring(0, 8);
        String encodedPw = passwordEncoder.encode(tempPw);

        // DB 비밀번호 업데이트
        userMapper.updatePassword(user.getUserId(), encodedPw);

        // 2. 메일 발송 서비스
        mailService.sendTempPasswordEmail(email, tempPw);

        log.info("유저 {}님에게 임시 비밀번호 메일 발송을 요청했습니다.", loginId);
        return tempPw;
    }
}