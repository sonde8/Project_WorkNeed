package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.RequestDTO;
import com.Workneed.workneed.Members.mapper.RequestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceAdminService {

    private final RequestMapper requestMapper;

    public List<RequestDTO> getPendingRequests() {
        return requestMapper.findPendingAttendanceRequests();
    }
}