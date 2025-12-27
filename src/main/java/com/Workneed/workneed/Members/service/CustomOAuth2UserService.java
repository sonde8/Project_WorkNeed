package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.SocialAccountDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.SocialAccountMapper;
import com.Workneed.workneed.Members.mapper.UserMapper;
import com.Workneed.workneed.config.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserMapper userMapper;
    private final SocialAccountMapper socialAccountMapper;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. 구글로부터 정보 로드
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String googleId = (String) attributes.get("sub");
        String pic = (String) attributes.get("picture"); // 구글 프로필 이미지 URL

        // 2. 소셜 연동 테이블 조회
        SocialAccountDTO socialAccount = socialAccountMapper.findBySocialAccount("google", googleId);
        UserDTO userDto;

        if (socialAccount != null) {
            // [이미 연동됨] 기존 연동 정보를 통해 사원 조회
            userDto = userMapper.findById(socialAccount.getUserId());
        } else {
            // [처음 연동함] 이메일로 우리 사원인지 확인
            userDto = userMapper.findByEmail(email);

            if (userDto == null) {
                throw new OAuth2AuthenticationException("등록된 사원 정보가 없습니다. 관리자에게 문의하세요.");
            }

            // [최초 연동 기록] SocialAccount 테이블에 저장 (이미지 필드 제외)
            SocialAccountDTO newSocial = SocialAccountDTO.builder().userId(userDto.getUserId()).socialProvider("google").socialProviderUserId(googleId).socialEmail(email).socialLinkedAt(LocalDateTime.now()).build();

            socialAccountMapper.insertSocialAccount(newSocial);
        }

        // 3. User 테이블 및 DTO에 프로필 이미지 반영
        // 소셜 로그인 시마다 최신 프로필 이미지를 유지하고 싶다면 DB도 업데이트 합니다.
        if (pic != null) {
            userDto.setUserProfileImage(pic); // DTO의 기존 필드명(userProfileImage) 사용

            // 필요하다면 DB의 User 테이블도 업데이트 (선택 사항)
            // userMapper.updateProfileImage(userDto.getUserId(), pic);
        }

        // 4. 인증 객체 생성
        return new CustomUserDetails(userDto, oAuth2User.getAttributes());
    }
}