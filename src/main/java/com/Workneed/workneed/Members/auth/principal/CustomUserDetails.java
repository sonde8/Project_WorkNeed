package com.Workneed.workneed.Members.auth.principal;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.UserDTO;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
public class CustomUserDetails implements UserDetails, OAuth2User {

    private UserDTO userDto;           // 일반 유저 정보
    private AdminUserDTO adminDto;     // 관리자 정보 (추가)
    private String role;               // 권한 정보 (추가)
    private Map<String, Object> attributes;

    // 1. 일반 로그인용 (UserService에서 사용)
    public CustomUserDetails(UserDTO userDto, String role) {
        this.userDto = userDto;
        this.role = role != null ? role : "ROLE_USER";
    }

    // 2. 관리자 로그인용 (UserService에서 사용)
    public CustomUserDetails(AdminUserDTO adminDto, String role) {
        this.adminDto = adminDto;
        this.role = role;
    }

    // 3. 소셜 로그인용 (기존 유지)
    public CustomUserDetails(UserDTO userDto, Map<String, Object> attributes) {
        this.userDto = userDto;
        this.attributes = attributes;
        this.role = "ROLE_USER";
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 지정된 권한(ROLE_USER 또는 ROLE_ADMIN)을 반환합니다.
        return Collections.singleton(new SimpleGrantedAuthority(this.role));
    }

    @Override
    public String getPassword() {
        // 관리자면 관리자 비번, 유저면 유저 비번 반환
        return (adminDto != null) ? adminDto.getAdminPassword() : userDto.getUserPassword();
    }

    @Override
    public String getUsername() {
        // 관리자면 이메일(ID역할), 유저면 로그인ID 반환
        return (adminDto != null) ? adminDto.getAdminEmail() : userDto.getUserLoginId();
    }

    @Override
    public String getName() {
        if (adminDto != null) return adminDto.getAdminName(); // 관리자 이름 우선
        if (userDto != null && userDto.getUserEmail() != null) return userDto.getUserEmail();
        if (attributes != null && attributes.get("sub") != null) return attributes.get("sub").toString();
        return "UNKNOWN_USER";
    }

    public String getProfileImage() {
        // 1. 유저 정보가 있고, 그 안에 사진 경로가 있다면 반환
        if (this.userDto != null && this.userDto.getUserProfileImage() != null) {
            return this.userDto.getUserProfileImage();
        }

        // 2. 관리자이거나 사진이 없는 경우 null 반환 (HTML에서 기본이미지 처리됨)
        return null;
    }


    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // BANNED만 따로 관리 (LockedException 유발)
        if (userDto != null && "BANNED".equals(userDto.getUserStatus())) {
            return false;
        }
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        if (adminDto != null) {
            // 관리자 상태가 ACTIVE일 때만 true 반환
            return "ACTIVE".equals(adminDto.getAdminStatus());
        }

        // 3. 일반 유저인 경우 'ACTIVE' 상태일 때만 true 반환
        if (userDto != null && userDto.getUserStatus() != null) {
            // ACTIVE가 아니면(INACTIVE, SUSPENDED, BANNED) false를 반환하여 로그인 차단
            return "ACTIVE".equals(userDto.getUserStatus());
        }
        return false;
    }
}