package com.Workneed.workneed.config;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // application.properties에 설정한 uploads 폴더명
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 실제 물리적인 저장 경로 (C:/.../uploads/)
        String resourcePath = System.getProperty("user.dir") + File.separator + uploadDir + File.separator;

        // 웹 주소 /upload/ 로 시작하는 모든 요청을 실제 물리 경로로 연결
        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:" + resourcePath);
    }
}