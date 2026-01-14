package com.Workneed.workneed.config;

import com.Workneed.workneed.Members.auth.principal.LoginFailureHandler;
import com.Workneed.workneed.Members.auth.principal.LoginSuccessHandler;
import com.Workneed.workneed.Members.service.CustomOidcUserService;
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
    private final LoginSuccessHandler loginSuccessHandler;
    private final CustomOidcUserService customOidcUserService;
    private final LoginFailureHandler loginFailureHandler;


    //보안 접속통로 관리
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                // CSRF 
                //  frame:클릭재킹-다른 도메인이 아니면 위에 창을 못띄위게 막는 필터링-
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin()))
                
                // 누구나 접근 가능한 매핑
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/login", "/login-user",
                                "/register/**",
                                "/api/mail/**",


                                "/oauth2/authorization/**",
                                "/login/oauth2/**",

                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/layout/**",
                                "/favicon.ico",
                                "/upload/**"
                        ).permitAll()

                        // 부서권한 있는 사람만 접근
                        .requestMatchers("/admin/dept/**")
                        .hasAnyAuthority(
                                "DEPT_ASSIGN",
                                "DEPT_CREATE",
                                "DEPT_UPDATE",
                                "DEPT_DELETE"
                        )

                        //직급권한 있는 사람만 접근
                        .requestMatchers("/admin/rank/**")
                        .hasAnyAuthority(
                                "RANK_ASSIGN",
                                "RANK_CREATE",
                                "RANK_UPDATE",
                                "RANK_DELETE"
                        )

                        //휴가권한 있는 사람만 접근
                        .requestMatchers("/admin/leave/**")
                        .hasAnyAuthority(
                                "LEAVE_APPROVE",
                                "LEAVE_REJECT"
                        )

                        //근태권한 있는 사람만 접근
                        .requestMatchers("/admin/attend/**")
                        .hasAnyAuthority(
                                "ATTEND_APPROVE",
                                "ATTEND_REJECT"
                        )

                        // 관리자만 들어올수있는 필터링 , 로그인한 사람만 메인 접근가능
                        .requestMatchers("/admin/**", "/main/**").authenticated()
                        // [핵심]명시적 허용 외에 전부 로그인 후 사용가능하게 하는 필터링
                        .anyRequest().authenticated()
                )


                // 일반 로그인
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login-user")
                        .usernameParameter("loginId")
                        .passwordParameter("password")
                        .successHandler(loginSuccessHandler)
                        .failureHandler(loginFailureHandler)
                        .defaultSuccessUrl("/main", true)
                )


                // 자동 로그인
                .rememberMe(r -> r
                        .key("workneed-secret-key")
                        .tokenValiditySeconds(60 * 60 * 24 * 365)
                        .useSecureCookie(false)                  // HTTPS 기준
                        .userDetailsService(totalAuthService)
                )

                // 소셜 로그인
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .userInfoEndpoint(userInfo -> userInfo
                                .oidcUserService(customOidcUserService)
                                .userService(customOAuth2UserService)
                        )
                        .successHandler(loginSuccessHandler)
                        .failureHandler(loginFailureHandler)
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
