package com.Workneed.workneed.Members.controller;

import com.Workneed.workneed.Members.entity.User;
import com.Workneed.workneed.Members.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;



@Controller
@RequiredArgsConstructor
public class UserController {

     private  final  UserService userService;



}

