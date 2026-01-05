package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.AttendanceDTO;
import com.Workneed.workneed.Members.dto.AttendancePayload;
import com.Workneed.workneed.Members.dto.RequestDTO;
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import com.Workneed.workneed.Members.mapper.AttendanceMapper;
import com.Workneed.workneed.Members.mapper.RequestMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AttendanceApproveService {

    private final RequestMapper requestMapper;
    private final AttendanceMapper attendanceMapper;
    private final AdminUserMapper adminUserMapper;
    private final ObjectMapper objectMapper;

    // ✅ 승인
    @Transactional
    public void approve(Long requestId, Long adminId) {

        try {
            RequestDTO req = requestMapper.findById(requestId);
            if (!"PENDING".equals(req.getStatus())) return;

            AttendancePayload payload =
                    objectMapper.readValue(
                            req.getRequestPayload(), AttendancePayload.class);

            AttendanceDTO attendance =
                    attendanceMapper.findByUserAndDate(
                            req.getUserId(), payload.getWorkDate());

            int minutes = (int)
                    Duration.between(
                            payload.getFromTime(), payload.getToTime()
                    ).toMinutes();

            if (attendance == null) {
                attendanceMapper.insertOvertime(
                        req.getUserId(),
                        payload.getWorkDate(),
                        minutes
                );
            } else {
                attendanceMapper.updateOvertime(
                        attendance.getAttendanceId(),
                        minutes
                );
            }

            requestMapper.approve(requestId, adminId);

            adminUserMapper.insertActivityLog(
                    AdminUserDTO.builder()
                            .adminId(adminId)
                            .logActionType("APPROVE_ATTENDANCE")
                            .logTargetType("ATTENDANCE")
                            .logTargetId(req.getUserId())
                            .logDescription("근태 수정 승인")
                            .build()
            );

        } catch (Exception e) {
            throw new RuntimeException("근태 승인 처리 실패", e);
        }
    }

    // ❌ 반려
    @Transactional
    public void reject(Long requestId, Long adminId, String reason) {

        try {
            RequestDTO req = requestMapper.findById(requestId);
            if (!"PENDING".equals(req.getStatus())) return;

            Map<String, Object> payload =
                    objectMapper.readValue(req.getRequestPayload(), Map.class);
            payload.put("rejectReason", reason);

            requestMapper.reject(
                    requestId,
                    adminId,
                    objectMapper.writeValueAsString(payload)
            );

            adminUserMapper.insertActivityLog(
                    AdminUserDTO.builder()
                            .adminId(adminId)
                            .logActionType("REJECT_ATTENDANCE")
                            .logTargetType("ATTENDANCE")
                            .logTargetId(req.getUserId())
                            .logDescription("근태 수정 반려")
                            .build()
            );

        } catch (Exception e) {
            throw new RuntimeException("근태 반려 처리 실패", e);
        }
    }
}
