package com.Workneed.workneed.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

//Spring 설정파일 인식시킨다. 서버 시작시 가장 먼저 로딩 -> 없으면 인터셉터 등록 , 자동 로그인등록 x
@Configuration
@RequiredArgsConstructor          // Spring MVC 기본설정 커스터마이징가능 인터셉트 , 포맷 , 리소스 핸들러 , cors 부분적오버라이드 가능
public class WebConfig implements WebMvcConfigurer {

    //interceptor 등록
    private final AutoLoginInterceptor autoLoginInterceptor;

    // registry: 인터셉트를 어디에 적용할지 기록하는 객체
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(autoLoginInterceptor) //인터셉터를한다
                .addPathPatterns("/**")               // 모든 요청 url에
                .excludePathPatterns(                 // 제외하는 부분
                        "/login",
                        "/register",
                        "/css/**",
                        "/js/**",
                        "/images/**"
                );
    }
}
