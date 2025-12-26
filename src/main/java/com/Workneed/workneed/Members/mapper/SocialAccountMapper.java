package com.Workneed.workneed.Members.mapper;
import com.Workneed.workneed.Members.dto.SocialAccountDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SocialAccountMapper {

    SocialAccountDTO findByProviderAndProviderUserId(
            @Param("provider") String provider,
            @Param("providerUserId") String providerUserId
    );

    SocialAccountDTO findByUserIdAndProvider(
            @Param("userId") Long userId,
            @Param("provider") String provider
    );

    void insertSocialAccount(SocialAccountDTO account);

    void deleteByUserIdAndProvider(
            @Param("userId") Long userId,
            @Param("provider") String provider
    );
}
