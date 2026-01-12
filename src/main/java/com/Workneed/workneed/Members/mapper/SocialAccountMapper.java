package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.dto.SocialAccountDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SocialAccountMapper {

    // 같은 구글계정이 다른 User에 붙이있는지 확인용 , 소셜 계정 기준하여 중복확인
    SocialAccountDTO findBySocialAccount(
            @Param("provider") String provider,
            @Param("providerUserId") String providerUserId
    );

    // 이 User가 미 provider(소셜_google) 연동한 적 있나 확인용, 유저 기준 중복확인
    SocialAccountDTO findByUserAndProvider(
            @Param("userId") Long userId,
            @Param("provider") String provider
    );

    // 정보 추가하여 실제 연동저장 
    void insertSocialAccount(SocialAccountDTO account);

}
