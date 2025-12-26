package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.GoogleUserInfoDTO;
import com.Workneed.workneed.Members.mapper.SocialAccountMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SocialConnectService {

    private final SocialAccountMapper socialAccountMapper;

    private GoogleUserInfoDTO getGoogleUserInfo(String code) {

        RestTemplate restTemplate = new RestTemplate();

        // code → access_token
        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String tokenRequestBody =
                "client_id=" + 547206152696-42d2r75v7lumumv852nce0b1u7k008q1.apps.googleusercontent.com +
                        "&client_secret=" + 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 +
                        "&code=" + code +
                        "&grant_type=authorization_code" +
                        "&redirect_uri=" + http://localhost:8080/auth/google/callback;

        HttpEntity<String> tokenRequest =
                new HttpEntity<>(tokenRequestBody, tokenHeaders);

        ResponseEntity<Map> tokenResponse =
                restTemplate.postForEntity(
                        "https://oauth2.googleapis.com/token",
                        tokenRequest,
                        Map.class
                );

        Map<String, Object> tokenBody = tokenResponse.getBody();
        if (tokenBody == null || tokenBody.get("access_token") == null) {
            return null;
        }

        String accessToken = (String) tokenBody.get("access_token");

        // 2️⃣ access_token → userinfo
        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.setBearerAuth(accessToken);

        HttpEntity<Void> userRequest = new HttpEntity<>(userHeaders);

        ResponseEntity<Map> userResponse =
                restTemplate.exchange(
                        "https://www.googleapis.com/oauth2/v3/userinfo",
                        HttpMethod.GET,
                        userRequest,
                        Map.class
                );

        Map<String, Object> userInfo = userResponse.getBody();
        if (userInfo == null) {
            return null;
        }

        // 3️⃣ DTO 변환
        return GoogleUserInfoDTO.builder()
                .googleProviderId((String) userInfo.get("sub"))
                .googleEmail((String) userInfo.get("email"))
                .googleProfileImage((String) userInfo.get("picture"))
                .build();
    }


    public void connect(String provider, String code, Long userId) {

        // provider(google)과 같지않다면
        if (!"google".equals(provider)) {
            throw new IllegalArgumentException("지원하지 않는 소셜 제공자");
        }

        //구글 유저정보 조회-UserInfo로 구글사용자정보가져와서 넘김-
        //(sub,email,piructre) 구글고유 폼  api 호출로직
        GoogleUserInfoDTO googleUserInfoDTO = getGoogleUserInfo(code);
        if(googleUserInfoDTO == null){
            throw new IllegalArgumentException("Google 사용자 정보를 가져오지 못했습니다.")
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
                "google", providerUserId ) != null) {
            throw new IllegalArgumentException("이미 다른 계정에 연동된 google 계정입니다.");

        }

        //저장
        SocialAccountDTO accountDTO = SocialAccountDTO.builder()
                .userId(userId)
                .socialProvider("google")
                .socialProviderUserId(providerUserId)
                .socialEmail(email)
                .build();
        socialAccountMapper.insertSocialAccount(accountDTO);


    }


}
