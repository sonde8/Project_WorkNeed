package com.Workneed.workneed.Members.oauth;

import com.Workneed.workneed.Members.dto.GoogleUserInfoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class GoogleOAuthClient {    // 통신담당 서비스에 모든 비즈니스 로직

    // 구글 클라이언트 id
    @Value("${google.client-id}")
    private String clientId;

    // 구글 클라이언트 pw
    @Value("${google.client-secret}")
    private String clientSecret;

    // 구글 반환 uri
    @Value("${google.redirect-uri}")
    private String redirectUri;


    private final RestTemplate restTemplate = new RestTemplate();

    public GoogleUserInfoDTO getUserInfo(String code) {

        // code → access_token
        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body =
                "client_id=" + clientId +
                        "&client_secret=" + clientSecret +
                        "&code=" + code +
                        "&grant_type=authorization_code" +
                        "&redirect_uri=" + redirectUri;

        HttpEntity<String> tokenRequest = new HttpEntity<>(body, tokenHeaders);

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

        //  access_token → userinfo
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

        // DTO 변환
        return GoogleUserInfoDTO.builder()
                .googleProviderId((String) userInfo.get("sub"))
                .googleEmail((String) userInfo.get("email"))
                .googleProfileImage((String) userInfo.get("picture"))
                .build();
    }
}

