package com.Workneed.workneed;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.Workneed.workneed.Members.mapper")
public class WorkneedApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkneedApplication.class, args);
    }
}
