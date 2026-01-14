package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.SocialAccountDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.SocialAccountMapper;
import com.Workneed.workneed.Members.mapper.UserMapper;
import com.Workneed.workneed.Members.auth.principal.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 로그 사용을 위한 임포트
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j // 이게 있어야 log.info를 사용할 수 있습니다.
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserMapper userMapper;
    private final SocialAccountMapper socialAccountMapper;

    private static final String DEFAULT_IMG = "/images/default-profile.svg";


    // oauth2.0 시 sercurity가 자동 loaduser호출 여기서 정보빼내기-혹시모를에러방지
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        return process(oAuth2User.getAttributes());
    }
    
    /**
     * 구글 프로필 이미지인지
     */
    private boolean isGoogleImage(String url) {
        return url != null && url.contains("googleusercontent.com");
    }

    /**
     * 사용자가 업로드한 이미지인지 (S3/CloudFront/내 도메인 포함)
     */
    private boolean isUploadedImage(String url) {
        if (url == null || url.isBlank()) return false;

        // ✅ 업로드 이미지: http로 시작하면서 구글 이미지가 아닌 것
        if (url.startsWith("http") && !isGoogleImage(url)) return true;

        // ✅ 로컬 업로드 경로도 혹시 남아있으면 같이 지원
        if (url.contains("/upload/") || url.contains("/uploads/")) return true;

        return false;
    }

    private boolean isDefaultImage(String url) {
        if (url == null || url.isBlank()) return true;
        return url.contains("default-profile.svg");
    }


    @Transactional
    public OAuth2User process(Map<String, Object> attributes) {
        String email = (String) attributes.get("email");
        String googleId = (String) attributes.get("sub");
        String pic = (String) attributes.get("picture");

        // 1. 소셜 계정 존재 여부 확인
        SocialAccountDTO socialAccount = socialAccountMapper.findBySocialAccount("google", googleId);

        UserDTO userDto;

        if (socialAccount != null) {
            // [이미 연동된 경우] DB에서 사원 정보를 불러옴
            userDto = userMapper.findById(socialAccount.getUserId());
            log.info("기존 소셜 계정 로그인: {}", email);
        } else {
            // [최초 연동인 경우] 이메일로 사원 정보 먼저 찾기
            userDto = userMapper.findByEmail(email);
            if (userDto == null) {
                log.error("사원 정보 없음: {}", email);
                throw new OAuth2AuthenticationException(new OAuth2Error("no_user"), "등록된 사원 정보가 없습니다.");
            }

            // 여기서 연동 정보를 딱 한 번만 저장
            SocialAccountDTO newSocial = SocialAccountDTO.builder()
                    .userId(userDto.getUserId())
                    .socialProvider("google")
                    .socialProviderUserId(googleId)
                    .socialEmail(email)
                    .socialLinkedAt(LocalDateTime.now())
                    .build();

            socialAccountMapper.insertSocialAccount(newSocial);
            log.info("새로운 소셜 연동 성공: {}", email);
        }

        // 2. 계정 상태 체크
        if (!"ACTIVE".equals(userDto.getUserStatus())) {
            String reason = "pending"; // 기본값은 승인 대기

            // INACTIVE 상태일 때만 날짜를 계산해서 '휴직(inactive)'으로 바꿀지 결정
            if ("INACTIVE".equals(userDto.getUserStatus())) {
                if (userDto.getUserCreatedAt() != null) {
                    java.time.LocalDate signupDate = userDto.getUserCreatedAt().toLocalDate();
                    java.time.LocalDate today = java.time.LocalDate.now();
                    long days = java.time.temporal.ChronoUnit.DAYS.between(signupDate, today);
                    if (days >= 30) {
                        reason = "inactive";
                    }
                }
            } else if ("SUSPENDED".equals(userDto.getUserStatus())) {
                reason = "suspended";
            } else if ("BANNED".equals(userDto.getUserStatus())) {
                reason = "banned";
            }

            throw new OAuth2AuthenticationException(new OAuth2Error("login_failed", reason, null));
        }


        // 3. 프로필 이미지 업데이트 (기본 이미지 정책 적용)
        // 현재 DB에 저장된 이미지 경로를 가져옵니다.
        String currentImg = userDto.getUserProfileImage();

        // [핵심 로직] 이미 내가 직접 업로드한 사진이 있다면 구글 사진으로 덮어쓰지 않습니다.
        if (isUploadedImage(currentImg)) {
            log.info("업로드 프로필 유지 -> 구글 사진으로 덮어쓰기 금지: {}", currentImg);

        } else {
            // 구글 이미지 usable 체크
            boolean googlePicUsable =
                    pic != null && !pic.isBlank()
                            && !pic.contains("picture/0")
                            && !pic.contains("picture/1");

            if (googlePicUsable) {
                // ✅ 업로드가 아닌 경우에만 구글 사진 세팅
                userMapper.updateProfileImage(userDto.getUserId(), pic);
                userDto.setUserProfileImage(pic);
                log.info("구글 프로필 이미지로 업데이트: {}", pic);
            } else {
                // ✅ 구글 이미지가 없으면 기본 이미지 보장
                if (isDefaultImage(currentImg)) {
                    userMapper.updateProfileImage(userDto.getUserId(), DEFAULT_IMG);
                    userDto.setUserProfileImage(DEFAULT_IMG);
                    log.info("구글 사진 없음 -> 기본 이미지 유지/보정: {}", DEFAULT_IMG);
                } else {
                    log.info("구글 사진 없음 -> 기존 이미지 유지: {}", currentImg);
                }
            }

        }

        log.info("OAuth SUCCESS: user={}, email={}", userDto.getUserName(), userDto.getUserEmail());
        return new CustomUserDetails(userDto, attributes);

    }
}