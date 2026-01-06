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

@Getter

public class CustomUserDetails implements UserDetails, OAuth2User {

    private final AdminUserDTO adminDto;
    private final UserDTO userDto;
    private final Map<String, Object> attributes;
    private final Collection<? extends GrantedAuthority> authorities;

    // 일반 로그인
    public CustomUserDetails(UserDTO userDto) {
        this.userDto = userDto;
        this.adminDto = null;
        this.attributes = null;
        this.authorities =
                List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    // 관리자 로그인
    public CustomUserDetails(AdminUserDTO adminDto,
                             Collection<? extends GrantedAuthority> authorities) {
        this.adminDto = adminDto;
        this.userDto = null;
        this.attributes = null;
        this.authorities = authorities;
    }

    public CustomUserDetails(UserDTO userDto, Map<String, Object> attributes) {
        this.userDto = userDto;
        this.adminDto = null;
        this.attributes = attributes;
        this.authorities =
                List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    // 기술적 계정 차단 탈퇴 계정
    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public String getPassword() {
        return adminDto != null
                ? adminDto.getAdminPassword()
                : userDto.getUserPassword();
    }

    @Override
    public String getUsername() {
        return adminDto != null
                ? adminDto.getAdminEmail()
                : userDto.getUserLoginId();
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public String getName() {
        if (adminDto != null) return adminDto.getAdminEmail();
        return userDto.getUserEmail();
    }


}