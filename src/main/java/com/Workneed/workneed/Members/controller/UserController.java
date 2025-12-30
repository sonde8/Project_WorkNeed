package com.Workneed.workneed.Members.controller;


import com.Workneed.workneed.Members.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;



@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

}

