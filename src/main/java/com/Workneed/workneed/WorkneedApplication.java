package com.Workneed.workneed;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class WorkneedApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkneedApplication.class, args);

        BCryptPasswordEncoder e = new BCryptPasswordEncoder();
        System.out.println(e.encode("1234"));



    }

}

