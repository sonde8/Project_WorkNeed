package com.Workneed.workneed.Members.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GoogleUserInfoDTO {

    private String googleProviderId;       // 구글 고유 사용자 id
    private String googleEmail;    // 이메일
    private String googleProfileImage;  // 프로필 이미지  url
}
