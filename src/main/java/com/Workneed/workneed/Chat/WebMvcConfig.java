package com.Workneed.workneed.Chat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // "file:" 접두사 뒤에 절대 경로를 붙이면 스프링이 맥,윈도우 OS에 맞게 해석해줌
        // Paths.get().toUri().toString()을 사용하면 OS별 접두사(file:/ 또는 file:///)를 자동 생성
        String resourceLocation = Paths.get(uploadDir).toUri().toString();

        registry.addResourceHandler("/uploads/**").addResourceLocations(resourceLocation);
    }
}
