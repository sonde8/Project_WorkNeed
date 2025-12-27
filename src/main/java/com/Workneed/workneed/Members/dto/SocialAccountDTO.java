package com.Workneed.workneed.Members.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialAccountDTO {

    private Long socialId;
    private Long userId;
    private String socialProvider;
    private String socialProviderUserId;
    private String socialEmail;
    private String socialAccessToken;
    private String socialRefreshToken;
    private LocalDateTime socialLinkedAt;
    private String socialProfileImage;
}
