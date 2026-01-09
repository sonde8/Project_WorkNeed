package com.Workneed.workneed.Attendance.service;

import com.Workneed.workneed.Attendance.dto.LeaveTeamUseDTO;
import com.Workneed.workneed.Attendance.mapper.LeaveMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamLeaveService {

    private final LeaveMapper leaveMapper;

    public List<LeaveTeamUseDTO> listDeptLeave(Long loginUserId, int year, String name) {

        Long deptId = leaveMapper.selectDeptIdByUserId(loginUserId);
        if (deptId == null) return List.of();

        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = start.plusYears(1);

        String keyword = (name == null || name.trim().isEmpty()) ? null : name.trim();

        return leaveMapper.selectDeptLeaveUsage(deptId, start, end, keyword);
    }
}
