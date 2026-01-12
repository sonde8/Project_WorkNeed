package com.Workneed.workneed.Members.service;

import com.Workneed.workneed.Attendance.mapper.AttendanceMapper;
import com.Workneed.workneed.Members.dto.AdminUserDTO;
import com.Workneed.workneed.Members.dto.MemberAttendanceDTO;
import com.Workneed.workneed.Members.dto.AttendancePayloadDTO;
import com.Workneed.workneed.Members.dto.RequestDTO;
import com.Workneed.workneed.Members.mapper.AdminUserMapper;
import com.Workneed.workneed.Members.mapper.MemberAttendanceMapper;
import com.Workneed.workneed.Members.mapper.RequestMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AttendanceApproveService {

    private final RequestMapper requestMapper;
    private final MemberAttendanceMapper memberAttendanceMapper;
    private final AdminUserMapper adminUserMapper;
    private final ObjectMapper objectMapper;
    private final AttendanceMapper attendanceMapper;

    /* =========================
       ✅ 승인
    ========================= */
    @Transactional
    public void approve(Long requestId, Long adminId) {

        try {
            RequestDTO req = requestMapper.findById(requestId);
            if (req == null || !"PENDING".equals(req.getStatus())) return;

            // 🔑 payload 파싱 (방어적으로)
            AttendancePayloadDTO payload = parsePayload(req.getRequestPayload());

            LocalDate workDate = payload.getWorkDate();
            if (workDate == null) {
                throw new IllegalStateException("근태 요청에 workDate가 없습니다.");
            }

            MemberAttendanceDTO attendance =
                    memberAttendanceMapper.findByUserAndDate(
                            req.getUserId(), workDate);

            // ⏱ 시간 정보가 있을 때만 계산
            if (payload.getFromTime() != null && payload.getToTime() != null) {

                LocalTime from = payload.getFromTime();
                LocalTime to = payload.getToTime();

                LocalDateTime inDt  = LocalDateTime.of(workDate, from);
                LocalDateTime outDt = LocalDateTime.of(workDate, to);

                int workMin = (int) Duration.between(inDt, outDt).toMinutes();
                if (workMin < 0) throw new IllegalStateException("시간 계산 오류");

                LocalTime OT_BASE = LocalTime.of(18, 10);
                int otMin = 0;
                if (to.isAfter(OT_BASE)) {
                    otMin = (int) Duration.between(OT_BASE, to).toMinutes();
                    if (otMin < 0) otMin = 0;
                }

                String isLate = from.isAfter(LocalTime.of(9, 0)) ? "Y" : "N";
                String isEarly = to.isBefore(LocalTime.of(18, 0)) ? "Y" : "N";

                attendanceMapper.upsertCorrected(
                        req.getUserId(),
                        workDate,
                        inDt,
                        outDt,
                        workMin,
                        otMin,
                        isLate,
                        isEarly,
                        "CORRECTED"
                );
            }

            //요청 승인 처리
            requestMapper.approve(requestId, adminId);

            //  관리자 로그
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

    /* =========================
       ❌ 반려
    ========================= */
    @Transactional
    public void reject(Long requestId, Long adminId, String reason) {

        try {
            RequestDTO req = requestMapper.findById(requestId);
            if (req == null || !"PENDING".equals(req.getStatus())) return;

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


    //🔑 payload 파싱- 근태 worktime 못받아옴
    private AttendancePayloadDTO parsePayload(String json) throws Exception {

        AttendancePayloadDTO payload =
                objectMapper.readValue(json, AttendancePayloadDTO.class);

        // 최소 필드 보장
        if (payload.getWorkDate() == null) {
            throw new IllegalStateException("payload.workDate 누락");
        }

        return payload;
    }
}
