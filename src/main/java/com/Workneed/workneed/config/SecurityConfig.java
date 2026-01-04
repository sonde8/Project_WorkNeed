package com.Workneed.workneed.config;

import com.Workneed.workneed.Members.auth.principal.LoginSuccessHandler;
import com.Workneed.workneed.Members.service.CustomOidcUserService;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import com.Workneed.workneed.Members.service.CustomOAuth2UserService;
import com.Workneed.workneed.Members.service.LocalUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final LocalUserDetailsService totalAuthService;
    private  final LoginSuccessHandler loginSuccessHandler;
    private final CustomOidcUserService customOidcUserService;


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
                                "/login", "/login-user",
                                "/register/**",
                                "/css/**", "/js/**", "/images/**",
                                "/oauth2/**", "/layout/**", "/favicon.ico"
                        ).permitAll()

                        // ※ 관리자는 아직 세션 기반이므로 일단 permit
                        .requestMatchers("/admin/**").authenticated()
                        .requestMatchers("/main","/main/**").authenticated()
                        .anyRequest().authenticated()
                )


                // 일반 로그인 (HTML 구조에 맞춤)
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login-user")
                        .usernameParameter("loginId")
                        .passwordParameter("password")
                        .successHandler(loginSuccessHandler)
                        .failureUrl("/login?error")
                )


                // 자동 로그인 (remember-me) — 핵심 5줄
                .rememberMe(r -> r
                        .key("workneed-secret-key")
                        .tokenValiditySeconds(60 * 60 * 24 * 365)
                        .useSecureCookie(false)                  // HTTPS 기준
                        .userDetailsService(totalAuthService)
                )



                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .userInfoEndpoint(userInfo -> userInfo
                                .oidcUserService(customOidcUserService) // ⭐ 핵심
                        )
                        .successHandler(loginSuccessHandler)
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
