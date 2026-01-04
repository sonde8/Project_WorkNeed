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

@Service
@RequiredArgsConstructor
public class CustomOidcUserService
        extends OidcUserService {

    private final CustomOAuth2UserService customOAuth2UserService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest)
            throws OAuth2AuthenticationException {

        // 🔥 OIDC 기본 처리
        OidcUser oidcUser = super.loadUser(userRequest);

        // 🔥 attributes 꺼내서
        Map<String, Object> attributes = oidcUser.getAttributes();

        // 🔥 네가 만든 OAuth 로직 강제 실행
        OAuth2User customUser =
                customOAuth2UserService.process(attributes);

        // 🔥 다시 OidcUser로 감싸서 반환
        return new DefaultOidcUser(
                oidcUser.getAuthorities(),
                oidcUser.getIdToken(),
                oidcUser.getUserInfo(),
                "email"
        );
    }
}
