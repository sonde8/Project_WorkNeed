package com.Workneed.workneed.Approval.service;

import com.Workneed.workneed.Approval.mapper.DocMapper;
import com.Workneed.workneed.Approval.entity.User;
import org.springframework.stereotype.Service;

@Service
public class LoginService {
    private final DocMapper Mapper;

    public LoginService(DocMapper Mapper) {
        this.Mapper = Mapper;
    }

    public User login(String loginId, String password) {
        User user = Mapper.findLoginUserByLoginId(loginId);
        if (user == null) {return null;}
        if(!password.equals(user.getPassword())){
            return null;

        }
        System.out.println("input loginId=" + loginId + ", pw=" + password);
        System.out.println("db user=" + user);

        return user;

    }

}
