package com.Workneed.workneed.Members.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class SocialAccount {

    private Long socialId;
    private Long userId;
    private String socialProvider;
    private String socialProviderUserId;
    private String socialEmail;
    private String socialAccessToken;
    private String socialRefreshToken;
    private LocalDateTime socialLinkedAt;
}
