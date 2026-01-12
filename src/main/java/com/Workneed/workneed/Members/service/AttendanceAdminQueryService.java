package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.RequestDTO;
import com.Workneed.workneed.Members.mapper.RequestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
//관리자 화면에 보여줄 목록 조회 전용 서비스
@Service
@RequiredArgsConstructor
public class AttendanceAdminQueryService {

    private final RequestMapper requestMapper;

    public List<RequestDTO> getPendingRequests() {
        return requestMapper.findPendingAttendanceRequests();
    }
}