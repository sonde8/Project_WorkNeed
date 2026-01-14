package com.Workneed.workneed.Members.auth.principal;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;

import java.util.List;
import java.util.Map;

//
@Getter
public class CustomUserDetails implements UserDetails, OAuth2User {

    private final AdminUserDTO adminDto;
    private final UserDTO userDto;
    private final Map<String, Object> attributes;
    private final Collection<? extends GrantedAuthority> authorities;

    // 일반 유저 로그인
    public CustomUserDetails(UserDTO userDto) {
        this.userDto = userDto;
        this.adminDto = null;
        this.attributes = null;
        this.authorities =
                List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    // 관리자 로그인-상세 권한 리스트 주입(authorities)-
    public CustomUserDetails(AdminUserDTO adminDto,
         Collection<? extends GrantedAuthority> authorities) {
        this.adminDto = adminDto;
        this.userDto = null;
        this.attributes = null;
        this.authorities = authorities;
    }

    // 소셜 로그인-구글엣 넘겨준 값(attributes) -
    public CustomUserDetails(UserDTO userDto, Map<String, Object> attributes) {
        this.userDto = userDto;
        this.adminDto = null;
        this.attributes = attributes;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    // 사용자의 권한을 서큐리티에게 알려줌
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }



    // 서큐리티가 db암호화된 값을 가져올때 분기로 선택 값 꺼냄
    @Override
    public String getPassword() {
        return adminDto != null
                ? adminDto.getAdminPassword()
                : userDto.getUserPassword();
    }

    // 고유 id값 가져오기
    @Override
    public String getUsername() {
        return adminDto != null
                ? adminDto.getAdminEmail()
                : userDto.getUserLoginId();
    }

    // *서큐리티 활성화 시 필수 필터링*
    //계정만료확인
    @Override public boolean isAccountNonExpired() {
        return true; }
    //계정잠금확인
    @Override public boolean isAccountNonLocked() {
        return true; }
    //비밀번호(자격 증명) 유효기간 확인
    @Override public boolean isCredentialsNonExpired() {
        return true; }
    // 계정 활성화/비활성화
    @Override
    public boolean isEnabled() {
        return true;
    }

    // 사용자의 이름을 조회 -관리자는 이메일 , 소셜로그인도 이메일- 공통식별자
    @Override
    public String getName() {
        if (adminDto != null)
            return adminDto.getAdminEmail();
        return userDto.getUserEmail();
    }

}