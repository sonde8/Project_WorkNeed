package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.SocialAccountDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.mapper.SocialAccountMapper;
import com.Workneed.workneed.Members.mapper.UserMapper;
import com.Workneed.workneed.config.CustomUserDetails;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 로그 사용을 위한 임포트
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j // 이게 있어야 log.info를 사용할 수 있습니다.
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
            // [이미 연동됨] 기존 정보를 통해 유저 로드
            userDto = userMapper.findById(socialAccount.getUserId());
        } else {
            // [처음 연동함] 이메일로 우리 사원인지 확인
            userDto = userMapper.findByEmail(email);

            if (userDto == null) {
                log.error("사원 정보 없음: {}", email);
                throw new OAuth2AuthenticationException("등록된 사원 정보가 없습니다. 관리자에게 문의하세요.");
            }

            // [최초 연동 기록] SocialAccount 테이블에 저장
            SocialAccountDTO newSocial = SocialAccountDTO.builder()
                    .userId(userDto.getUserId())
                    .socialProvider("google")
                    .socialProviderUserId(googleId)
                    .socialEmail(email)
                    .socialLinkedAt(LocalDateTime.now())
                    .build();

            socialAccountMapper.insertSocialAccount(newSocial);
            log.info("최초 소셜 연동 성공: {}", email);
        }

        // 3. 프로필 이미지 업데이트 (연동 여부와 상관없이 로그인 시마다 최신화)
        if (pic != null) {
            // DB 업데이트
            userMapper.updateProfileImage(userDto.getUserId(), pic);
            // 세션에 담길 객체에도 주소 주입 (그래야 화면에 바로 뜸)
            userDto.setUserProfileImage(pic);
            log.info("유저 [{}]의 프로필 사진 업데이트 완료", userDto.getUserName());
        }

        // 4. 세션 저장 (Thymeleaf 레이아웃 등에서 session.user로 접근하기 위함)
        ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
        if (attr != null) {
            HttpSession session = attr.getRequest().getSession(true);
            session.setAttribute("user", userDto);
        }

        // 5. 시큐리티 인증 객체 생성 (CustomUserDetails가 UserDTO를 받도록 설계된 경우)
        return new CustomUserDetails(userDto, attributes);
    }
}