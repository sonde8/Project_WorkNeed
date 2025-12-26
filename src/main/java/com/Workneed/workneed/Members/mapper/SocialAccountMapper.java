package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.entity.SocialAccount;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SocialAccountMapper {

    SocialAccount findByProviderAndProviderUserId(
            @Param("provider") String provider,
            @Param("providerUserId") String providerUserId
    );

    SocialAccount findByUserIdAndProvider(
            @Param("userId") Long userId,
            @Param("provider") String provider
    );

    void insertSocialAccount(SocialAccount account);

    void deleteByUserIdAndProvider(
            @Param("userId") Long userId,
            @Param("provider") String provider
    );
}
