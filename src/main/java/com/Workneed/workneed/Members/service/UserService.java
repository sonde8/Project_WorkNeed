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
        user.setUserStatus("INACTIVE"); // 회원가입시 비활성
        user.setDeptId(DEFAULT_DEPT_ID); // 부서 미지정
        user.setRankId(DEFAULT_RANK_ID); // 직급 신입
        userMapper.insertUser(user);
    }

    //비밀번호 재설정 암호하
    public void changePassword(Long userId, String currentPassword, String newPassword, String confirmPassword) {
        // 1 일치 여부 확인
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("새 비밀번호가 서로 일치하지 않습니다.");
        }

        // 2 8자리 이상 영문/숫자/특수문자 조합 검사 (정규식)
        String pwPattern =  "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$!%*#?&])[A-Za-z\\d$!%*#?&]{8,}$";
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
        String foundId = userMapper.findLoginIdByNameAndEmail(userName, userEmail);

        if (foundId == null) {
            return null; // 일치하는 정보 없음
        }

        // 마스킹 처리: 앞 2자만 보여주고 나머지는 * 처리 (예: admin -> ad***)
        if (foundId.length() > 2) {
            return foundId.substring(0, 2) + "*".repeat(foundId.length() - 2);
        }

        return foundId;
    }

    @Transactional
    public String createTempPassword(String loginId, String email) {
        UserDTO user = userMapper.findByLoginId(loginId);

        // 유저가 아예 없거나 이메일 정보가 없는 경우 안전하게 차단
        if (user == null || user.getUserEmail() == null) {
            return null;
        }

        // [중요] 입력받은 email을 먼저 써서 비교하면 null 에러를 방지
        if (!email.equals(user.getUserEmail())) {
            return null;
        }

        String tempPw = UUID.randomUUID().toString().substring(0, 8);
        String encodedPw = passwordEncoder.encode(tempPw);

        userMapper.updatePassword(user.getUserId(), encodedPw);

        return tempPw;
    }

}