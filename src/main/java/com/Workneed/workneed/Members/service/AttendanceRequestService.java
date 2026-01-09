package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.AttendanceRequestCreateDTO;
import com.Workneed.workneed.Members.dto.RequestDTO;
import com.Workneed.workneed.Members.mapper.RequestMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

//직원이 요청하는 근태
@Service
@RequiredArgsConstructor
public class AttendanceRequestService {

    private final RequestMapper requestMapper;
    private final ObjectMapper objectMapper;

    public void create(Long userId, AttendanceRequestCreateDTO dto) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("workDate", dto.getWorkDate());

        payload.put("fromTime", dto.getStartTime());  // 시작시간
        payload.put("toTime", dto.getEndTime());      // 종료시간

        payload.put("type", dto.getType());
        payload.put("reason", dto.getReason());

        try {
            RequestDTO request = RequestDTO.builder()
                    .userId(userId)
                    .requestType("ATTENDANCE")
                    .status("PENDING")
                    .requestPayload(objectMapper.writeValueAsString(payload))
                    .build();

            requestMapper.insert(request);

        } catch (Exception e) {
            throw new RuntimeException("근태 요청 JSON 변환 실패", e);
        }
    }

}