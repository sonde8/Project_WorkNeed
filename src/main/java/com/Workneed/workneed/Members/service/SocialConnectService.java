package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.GoogleUserInfoDTO;
import com.Workneed.workneed.Members.dto.SocialAccountDTO;
import com.Workneed.workneed.Members.mapper.SocialAccountMapper;
import com.Workneed.workneed.Members.oauth.GoogleOAuthClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SocialConnectService {

    private final SocialAccountMapper socialAccountMapper;
    private final GoogleOAuthClient googleOAuthClient;



    public void connect(String provider, String code, Long userId) {

        // provider(google)과 같지않다면
        if (!"google".equals(provider)) {
            throw new IllegalArgumentException("지원하지 않는 소셜 제공자");
        }

        //구글 유저정보 조회-UserInfo로 구글사용자정보가져와서 넘김-
        //(sub,email,piructre) 구글고유 폼  api 호출로직
        GoogleUserInfoDTO googleUserInfoDTO = googleOAuthClient.getUserInfo(code);
        if (googleUserInfoDTO == null) {
            throw new IllegalArgumentException("Google 사용자 정보를 가져오지 못했습니다.");
        }
        String providerUserId = googleUserInfoDTO.getGoogleProviderId();
        String email = googleUserInfoDTO.getGoogleEmail();

        // 이미 이 유저가 Google 연동했는지
        if (socialAccountMapper.findByUserAndProvider(
                userId, "google") != null) {
            throw new IllegalArgumentException("이미 Google 계정이 연동되어 있습니다.");
        }

        // 이 Google 계정이 다른 유저에 연동됐는지
        if (socialAccountMapper.findBySocialAccount(
                "google", providerUserId) != null) {
            throw new IllegalArgumentException("이미 다른 계정에 연동된 google 계정입니다.");

        }

        // "소셜" 계정에 저장
        SocialAccountDTO accountDTO = SocialAccountDTO.builder()
                .userId(userId)
                .socialProvider("google")
                .socialProviderUserId(providerUserId)
                .socialEmail(email)
                .socialProfileImage(googleUserInfoDTO.getGoogleProfileImage())
                .socialLinkedAt(LocalDateTime.now())
                .build();

    }


}
