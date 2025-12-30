package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AdminUserMapper adminUserMapper;
    private final PasswordEncoder passwordEncoder;

    public void createAdmin(AdminUserDTO admin) {
        admin.setAdminPassword(
                passwordEncoder.encode(admin.getAdminPassword())
        );
        admin.setAdminStatus("ACTIVE");
        adminUserMapper.insertAdmin(admin);
    }
}
