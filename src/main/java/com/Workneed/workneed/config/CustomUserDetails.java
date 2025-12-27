package com.Workneed.workneed.config;

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

    private final UserDTO userDto; // 우리 팀의 데이터 객체
    private Map<String, Object> attributes; // 구글에서 준 원본 정보

    // 일반 로그인용 생성자
    public CustomUserDetails(UserDTO userDto) {
        this.userDto = userDto;
    }

    // 소셜 로그인용 생성자
    public CustomUserDetails(UserDTO userDto, Map<String, Object> attributes) {
        this.userDto = userDto;
        this.attributes = attributes;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 권한 로직을 안 쓰더라도 ROLE_USER는 넣어줘야 시큐리티가 작동합니다.
        return Collections.singleton(new SimpleGrantedAuthority("ROLE_USER"));
    }


    @Override
    public String getName() {
        // 1. 먼저 DB에서 가져온 userDto의 이메일을 확인
        if (userDto != null && userDto.getUserEmail() != null && !userDto.getUserEmail().isEmpty()) {
            return userDto.getUserEmail();
        }

        // 2. 만약 DTO에 이메일이 없다면 OAuth2 attributes에서 'sub'(구글 고유 ID) 확인
        if (attributes != null && attributes.get("sub") != null) {
            return attributes.get("sub").toString();
        }

        // 3. 이것도 저것도 없다면 'email' 속성이라도 확인
        if (attributes != null && attributes.get("email") != null) {
            return attributes.get("email").toString();
        }

        // 4. [중요] 모든 조건이 실패했을 때의 기본 리턴값
        // 빈 값을 리턴하면 아까와 같은 에러가 나므로, 차라리 예외를 던지거나 식별 가능한 문자열을 줍니다.
        return attributes != null ? attributes.toString() : "UNKNOWN_USER";
    }


    @Override
    public String getPassword() {
        return userDto.getUserPassword();
    }

    @Override
    public String getUsername() {
        return userDto.getUserLoginId();
    }


    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}