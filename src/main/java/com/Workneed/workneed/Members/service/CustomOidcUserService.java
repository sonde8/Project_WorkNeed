package com.Workneed.workneed.Members.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

// 소셜 로그인시 oAuth2 로직과 단일화 시켜주는 서비스
@Service
@RequiredArgsConstructor
public class CustomOidcUserService
        extends OidcUserService {

    private final CustomOAuth2UserService customOAuth2UserService;

    //
    @Override
    public OidcUser loadUser(OidcUserRequest userRequest)
            throws OAuth2AuthenticationException {

        // OIDC 기본 처리
        OidcUser oidcUser = super.loadUser(userRequest);

        // attributes 꺼내서
        Map<String, Object> attributes = oidcUser.getAttributes();

        // [핵심]OAuth 로직 강제 실행
        // 모든 소셜 로그인 다른 로직을 하나로 통일(DB,세션 생성, 가입여부)
        // 일반 소셜 로그인과 똑같은 DB 테이블 사용 및 똑같은 보안 로직을 통과
        OAuth2User customUser =
                customOAuth2UserService.process(attributes);

        // 구글 로그인 승인 시 다시 OidcUser로 감싸서 반환
        return new DefaultOidcUser(
                oidcUser.getAuthorities(), // 구글이 넘긴 권한정보 유지
                oidcUser.getIdToken(),     // 토큰저장
                oidcUser.getUserInfo(),    // 구글 유저 정보 유지
                "email"                    // db에서 식별한 email 고정
        );
    }
}
