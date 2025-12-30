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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.core.user.OAuth2User;

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
                        // [수정] /login-user와 /login-admin을 허용 목록에 추가
                        .requestMatchers("/", "/main", "/login/**", "/login-user", "/login-admin", "/register/**", "/css/**", "/js/**", "/images/**", "/auth/**","/layout/**").permitAll()
                        .anyRequest().authenticated()
                )
                // 자동 로그인 필터 등록
                .addFilterBefore(autoLoginFilterConfig.autoLoginFilter(), UsernamePasswordAuthenticationFilter.class)

                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login-user")
                        .usernameParameter("loginId")
                        .passwordParameter("password")
                        // 1. 로그인 성공 시 처리
                        .successHandler((request, response, authentication) -> {
                            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

                            if (userDetails.getAdminDto() != null) {
                                request.getSession().setAttribute("admin", userDetails.getAdminDto());
                                response.sendRedirect("/admin/member/list");
                            } else {
                                UserDTO userDto = userDetails.getUserDto();
                                request.getSession().setAttribute("user", userDto);

                                String autoLogin = request.getParameter("autoLogin");
                                if ("on".equals(autoLogin)) {
                                    userService.clearRememberToken(userDto.getUserId());
                                    String token = UUID.randomUUID().toString();
                                    userService.saveRememberToken(userDto.getUserId(), token);
                                    Cookie cookie = new Cookie("autoLoginToken", token);
                                    cookie.setHttpOnly(true);
                                    cookie.setPath("/");
                                    cookie.setMaxAge(60 * 60 * 24 * 365);
                                    response.addCookie(cookie);
                                }
                                response.sendRedirect("/main");
                            }
                        })

                        // 2. [추가] 로그인 실패 시 처리 (팝업용 에러 코드 전송)
                        .failureHandler((request, response, exception) -> {
                            String errorType = "invalid"; // 기본: 비번 틀림

                            // CustomUserDetails에서 설정한 isEnabled, isAccountNonLocked 결과에 따라 예외가 달라짐
                            if (exception instanceof org.springframework.security.authentication.DisabledException) {
                                errorType = "inactive";
                            } else if (exception instanceof org.springframework.security.authentication.LockedException) {
                                errorType = "banned";
                            }

                            // 로그인 페이지로 에러 코드를 들고 리다이렉트
                            response.sendRedirect("/login?error=" + errorType);
                        })
                        .permitAll()
                )

                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler((request, response, authentication) -> {
                            // 1. 현재 일반 로그인된 유저 가져오기
                            UserDTO loginUser = (UserDTO) request.getSession().getAttribute("user");

                            // 2. 구글에서 넘겨준 정보들 가져오기
                            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                            String googleId = oAuth2User.getAttribute("sub");
                            String googleEmail = oAuth2User.getAttribute("email");
                            String pic = oAuth2User.getAttribute("picture"); // 이게 구글 프로필 사진 주소

                            if (loginUser != null) {
                                // 3. 서비스 호출 (연동 + 사진 업데이트를 한 번에!)
                                // ※ 아까 UserService에 pic 매개변수를 추가한 버전으로 만드셨어야 합니다.
                                userService.linkSocialAccount(loginUser.getUserId(), "google", googleId, googleEmail, pic);

                                // 4. 세션 정보 최신화 (사진이 바로 보이게)
                                if (pic != null) {
                                    loginUser.setUserProfileImage(pic);
                                    request.getSession().setAttribute("user", loginUser);
                                }

                                System.out.println("연동 및 사진 업데이트 성공: " + loginUser.getUserName());
                            }

                            // 5. 작업 완료 후 메인으로 리다이렉트
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