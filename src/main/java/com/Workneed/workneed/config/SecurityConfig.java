package com.Workneed.workneed.config;

import com.Workneed.workneed.Members.dto.UserDTO;
import com.Workneed.workneed.Members.service.CustomOAuth2UserService;
import com.Workneed.workneed.Members.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpSession;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.UUID;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final AutoLoginFilterConfig autoLoginFilterConfig;
    private final UserService userService;

    public SecurityConfig(
            CustomOAuth2UserService customOAuth2UserService,
            @Lazy AutoLoginFilterConfig autoLoginFilterConfig,
            @Lazy UserService userService) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.autoLoginFilterConfig = autoLoginFilterConfig;
        this.userService = userService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/main", "/login/**", "/register/**", "/css/**", "/js/**", "/images/**", "/auth/**").permitAll()
                        .anyRequest().authenticated()
                )
                // 자동 로그인 필터 등록
                .addFilterBefore(autoLoginFilterConfig.autoLoginFilter(), UsernamePasswordAuthenticationFilter.class)

                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .usernameParameter("loginId")
                        .passwordParameter("password")
                        .successHandler((request, response, authentication) -> {
                            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
                            UserDTO userDto = userDetails.getUserDto();

                            // 1. 세션에 유저 정보 저장
                            request.getSession().setAttribute("user", userDto);

                            // 2. [추가] 자동 로그인 체크박스 확인 ("on"으로 넘어옴)
                            String autoLogin = request.getParameter("autoLogin");
                            if ("on".equals(autoLogin)) {
                                // 기존 토큰 삭제 및 새 토큰 생성
                                userService.clearRememberToken(userDto.getUserId());
                                String token = UUID.randomUUID().toString();

                                // DB 저장
                                userService.saveRememberToken(userDto.getUserId(), token);

                                // 쿠키 발급 (1년)
                                Cookie cookie = new Cookie("autoLoginToken", token);
                                cookie.setHttpOnly(true);
                                cookie.setPath("/");
                                cookie.setMaxAge(60 * 60 * 24 * 365);
                                response.addCookie(cookie);
                            }

                            response.sendRedirect("/main");
                        })
                        .permitAll()
                )

                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler((request, response, authentication) -> {
                            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
                            request.getSession().setAttribute("user", userDetails.getUserDto());
                            response.sendRedirect("/main");
                        })
                )

                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .addLogoutHandler((request, response, authentication) -> {
                            HttpSession session = request.getSession(false);
                            if (session != null) {
                                UserDTO user = (UserDTO) session.getAttribute("user");
                                if (user != null) {
                                    userService.clearRememberToken(user.getUserId());
                                }
                            }
                        })
                        .logoutSuccessUrl("/login")
                        .deleteCookies("JSESSIONID", "autoLoginToken")
                        .invalidateHttpSession(true)
                );

        return http.build();
    }
}