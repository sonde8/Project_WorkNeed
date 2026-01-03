package com.Workneed.workneed.config;

import com.Workneed.workneed.Members.service.CustomOAuth2UserService;
import com.Workneed.workneed.Members.service.LocalUserDetailsService;
import com.Workneed.workneed.Members.auth.principal.PrincipalSessionSyncFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final LocalUserDetailsService totalAuthService;
    private final PrincipalSessionSyncFilter principalSessionSyncFilter;
    private  final  OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                // CSRF / frame
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))

                // 접근 권한
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/login",
                                "/login-user",
                                "/register/**",


                                "/oauth2/authorization/**",
                                "/login/oauth2/**",

                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/layout/**",
                                "/favicon.ico"
                        ).permitAll()
                        //  관리자는 아직 세션 기반이므로 일단 permit
                        .requestMatchers("/admin/**").permitAll()
                        .anyRequest().authenticated()
                )

                // OAuth2 로그인
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")

                        .userInfoEndpoint(userInfo ->
                                userInfo.userService(customOAuth2UserService)
                        )
                        .defaultSuccessUrl("/main", true)
                )


                // 일반 로그인 (HTML 구조에 맞춤)
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login-user")
                        .usernameParameter("loginId")
                        .passwordParameter("password")
                        .defaultSuccessUrl("/main", true)
                        .failureUrl("/login?error")
                )


                // 자동 로그인 (remember-me) — 핵심 5줄
                .rememberMe(r -> r
                        .key("workneed-secret-key")
                        .tokenValiditySeconds(60 * 60 * 24 * 365)
                        .useSecureCookie(false)                  // HTTPS 기준
                        .userDetailsService(totalAuthService)
                )

                // 로그인 전 필터로 먼저 세션연결
                .addFilterAfter(
                        principalSessionSyncFilter,
                        UsernamePasswordAuthenticationFilter.class
                )


                // 로그아웃
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID", "remember-me")
                );

        return http.build();
    }
}
