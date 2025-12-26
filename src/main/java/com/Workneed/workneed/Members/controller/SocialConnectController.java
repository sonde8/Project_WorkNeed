package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.SocialConnectService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Controller
@RequiredArgsConstructor
public class SocialConnectController {

    private final SocialConnectService socialConnectService;

    @Value("${google.client-id}")
    private String googleClientId;

    @Value("${google.redirect-uri}")
    private String googleRedirectUri;

    //소셜 계정 연동 시작 link
    @GetMapping("/auth/{provider}/link")
    public String linkSocialAccount(
            @PathVariable String provider) {
        if (!"google".equals(provider)) {
            throw new IllegalArgumentException("지원하지 않는 소셜 제공자");
        }

        String scope = URLEncoder.encode(
                "openid email profile",
                StandardCharsets.UTF_8
        );

        String authUrl =
                "https://accounts.google.com/o/oauth2/v2/auth" +
                        "?client_id=" + googleClientId +
                        "&redirect_uri=" + googleRedirectUri +
                        "&response_type=code" +
                        "&scope=" + scope;

        return "redirect:" + authUrl;
    }

    // 소셜 콜백. link에서 받은 코드를 이용해서 소셜 인증 후 콜백하여 메인으로
    @GetMapping("/auth/{provider}/callback")
    public String socialCallback(
            @PathVariable String provider,
            @RequestParam("code") String code,
            HttpSession session
    ) {
        // 1. 로그인 사용자 확인
        UserDTO loginUser = (UserDTO) session.getAttribute("user");
        if (loginUser == null) {
            throw new IllegalStateException("로그인 상태가 아닙니다.");
        }

        // 2. 소셜 연동 처리
        // 2. 서비스로 로직을 위임하여 서비스에서 상세처리 후 다시 복귀
        socialConnectService.connect(
                provider,
                code,
                loginUser.getUserId()
        );

        // 3. 메인으로 이동
        return "redirect:/main";
    }


}
