package com.Workneed.workneed.Members.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSocialLinkDTO {
    private String provider;          // GOOGLE
    private String providerUserId;    // sub
    private String providerEmail;
}
